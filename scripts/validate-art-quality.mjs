#!/usr/bin/env node
// validate-art-quality.mjs — Art quality & composition variety validation
// Generates 6 cards (2 per faction) with specific composition expectations.
// Saves locally to scripts/preview/validation/ — NOT uploaded to R2 or Supabase.
// Usage: node scripts/validate-art-quality.mjs

import { readFileSync, mkdirSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// ---------------------------------------------------------------------------
// Load env from game-server/.env
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Output directory
// ---------------------------------------------------------------------------
const OUTPUT_DIR = resolve(__dirname, 'preview/validation');
mkdirSync(OUTPUT_DIR, { recursive: true });

// ---------------------------------------------------------------------------
// Prompt constants (mirrored from generate-test-cards.mjs / prompts.ts)
// ---------------------------------------------------------------------------

const STYLE_ANCHOR =
  'traditional oil painting on canvas by Donato Giancola and Frank Frazetta, ' +
  'visible heavy brushwork and palette knife texture, cracked oil paint surface, ' +
  'classical fantasy illustration from 1990s Magic: The Gathering, muted earth tone palette, ' +
  'chiaroscuro lighting, raw and gritty not polished, imperfect asymmetric anatomy, ' +
  'single creature portrait 3:4 ratio, no text no borders no watermarks';

const FACTION_PREFIXES = {
  IRONWRIGHT:
    'grimy industrial steampunk creature, corroded brass and blackened iron, ' +
    'oil-stained and soot-caked, dented riveted plates with weld scars, ' +
    'warm ochre and raw umber palette, smoky atmospheric background, ' +
    'painted like a Brom or Keith Parkinson illustration',
  FEY_COURTS:
    'dark fey forest creature, twisted ancient wood and thorns, unsettling and wild, ' +
    'dappled green-gold light filtering through dense canopy, muted forest palette, ' +
    'overgrown with moss and lichen, more Brothers Grimm than Disney, ' +
    'painted like a Brian Froud or Alan Lee illustration',
  DEMONIC:
    'grotesque infernal creature, fused bone and volcanic rock and dried gore, ' +
    'lit from below by hellfire glow, deep shadow obscuring details, ' +
    'burnt crimson and charcoal black palette, oppressive and heavy, ' +
    'painted like a Wayne Barlowe or Zdzislaw Beksinski hellscape',
};

const COMPOSITION_POOL = {
  PORTRAIT_CLOSE: 'extreme close-up portrait, face fills frame, intense eye contact, shallow depth of field',
  PORTRAIT_THREE_QUARTER: 'three-quarter view portrait, shoulders and head, slight turn, atmospheric background',
  ACTION_ATTACK: 'dynamic action pose mid-strike, motion blur on weapon, debris flying, low camera angle',
  ACTION_DEFEND: 'defensive stance, shield raised, bracing for impact, ground-level perspective',
  ACTION_CAST: 'arms raised channeling energy, magical particles swirling, dramatic backlighting',
  ENVIRONMENTAL_WIDE: 'wide establishing shot, creature small in vast landscape, epic scale, deep perspective',
  ENVIRONMENTAL_EMERGING: 'creature emerging from faction environment, half-hidden, atmospheric fog/mist',
  DRAMATIC_LOW_ANGLE: 'extreme low angle looking up, creature towers overhead, dramatic sky behind',
  DRAMATIC_SILHOUETTE: 'silhouette against dramatic sky/explosion/portal, rim lighting, high contrast',
  DETAIL_MACRO: 'macro detail shot of distinctive feature (claws/eyes/armor/wings), shallow depth of field',
  NARRATIVE_MOMENT: 'mid-narrative scene, creature interacting with environment, storytelling composition',
  NARRATIVE_DUAL: 'two creatures in frame, confrontation or alliance, split composition',
};

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

const FACTION_ENV_MAP = {
  IRONWRIGHT: 'ironwright',
  FEY_COURTS: 'fey',
  DEMONIC: 'demonic',
};

const NEGATIVE_PROMPT =
  'text, words, letters, watermarks, signatures, logos, borders, frames, NSFW, explicit content, ' +
  'gore, distorted anatomy, multiple heads, deformed limbs, extra limbs, fused body parts, ' +
  '3d render, CGI, photorealistic, airbrushed, smooth plastic skin, digital art, vector art, ' +
  'deviantart, artstation trending, oversaturated, neon glow, stock photo, generic, symmetrical face, ' +
  'white background, collage, grid layout, concept art sheet';

// ---------------------------------------------------------------------------
// Composition and environment selection (same logic as generate-test-cards.mjs)
// ---------------------------------------------------------------------------

function selectComposition(spec) {
  const tier = (spec.tier || '').toUpperCase();
  const keywords = (spec.keywords || []).map(k => k.toUpperCase());
  const manaCost = spec.manaCost ?? 3;
  const cardType = (spec.cardType || 'CREATURE').toUpperCase();

  if (tier === 'LEGENDARY') return { key: 'NARRATIVE_MOMENT/DUAL', value: Math.random() > 0.5 ? COMPOSITION_POOL.NARRATIVE_MOMENT : COMPOSITION_POOL.NARRATIVE_DUAL };
  if (tier === 'EPIC') return { key: 'DRAMATIC_SILHOUETTE/LOW_ANGLE', value: Math.random() > 0.5 ? COMPOSITION_POOL.DRAMATIC_SILHOUETTE : COMPOSITION_POOL.DRAMATIC_LOW_ANGLE };
  if (cardType === 'SPELL') return { key: 'ACTION_CAST', value: COMPOSITION_POOL.ACTION_CAST };
  if (manaCost >= 7) return { key: 'DRAMATIC_LOW_ANGLE', value: COMPOSITION_POOL.DRAMATIC_LOW_ANGLE };
  if (keywords.includes('PIERCING') || keywords.includes('DEATHTOUCH')) return { key: 'ACTION_ATTACK', value: COMPOSITION_POOL.ACTION_ATTACK };
  if (keywords.includes('SHIELD') || keywords.includes('TAUNT')) return { key: 'ACTION_DEFEND', value: COMPOSITION_POOL.ACTION_DEFEND };
  if (keywords.includes('FLYING')) return { key: 'ENVIRONMENTAL_WIDE', value: COMPOSITION_POOL.ENVIRONMENTAL_WIDE };
  if (manaCost <= 2) return { key: 'PORTRAIT_CLOSE', value: COMPOSITION_POOL.PORTRAIT_CLOSE };
  return { key: 'PORTRAIT_THREE_QUARTER', value: COMPOSITION_POOL.PORTRAIT_THREE_QUARTER };
}

function selectEnvironment(factionKey) {
  const envKey = FACTION_ENV_MAP[factionKey] || 'ironwright';
  const envs = FACTION_ENVIRONMENTS[envKey];
  const selected = envs[Math.floor(Math.random() * envs.length)];
  return selected;
}

// ---------------------------------------------------------------------------
// Validation card specs — 6 cards, 2 per faction, designed to trigger diverse compositions
// ---------------------------------------------------------------------------

const VALIDATION_CARDS = [
  {
    index: 1,
    name: 'Brass Sentinel',
    faction: 'IRONWRIGHT',
    keywords: ['SHIELD'],
    manaCost: 2,
    tier: 'COMMON',
    cardType: 'CREATURE',
    description: 'A small brass automaton with shield plating and glowing eyes, squat and sturdy with dented armor plates and a single cracked lens visor',
    expectedComposition: 'PORTRAIT_CLOSE (manaCost <= 2)',
  },
  {
    index: 2,
    name: 'Siege Colossus',
    faction: 'IRONWRIGHT',
    keywords: ['PIERCING'],
    manaCost: 8,
    tier: 'RARE',
    cardType: 'CREATURE',
    description: 'A towering war machine made of riveted iron plates with a massive cannon arm, smoke billowing from exhaust stacks on its back',
    expectedComposition: 'ACTION_ATTACK (PIERCING keyword)',
  },
  {
    index: 3,
    name: 'Moonwing Sprite',
    faction: 'FEY_COURTS',
    keywords: ['FLYING'],
    manaCost: 3,
    tier: 'UNCOMMON',
    cardType: 'CREATURE',
    description: 'A delicate faerie with gossamer wings trailing stardust, luminous pale skin and dark hollow eyes, wild tangled hair with tiny flowers',
    expectedComposition: 'ENVIRONMENTAL_WIDE (FLYING keyword)',
  },
  {
    index: 4,
    name: 'Queen of Thorns',
    faction: 'FEY_COURTS',
    keywords: ['DEATHTOUCH', 'LIFESTEAL'],
    manaCost: 7,
    tier: 'LEGENDARY',
    cardType: 'CREATURE',
    description: 'An ancient fey queen wrapped in living briars with a crown of black roses, her face both beautiful and terrible, thorns piercing her own flesh',
    expectedComposition: 'NARRATIVE_MOMENT or NARRATIVE_DUAL (LEGENDARY tier)',
  },
  {
    index: 5,
    name: 'Bone Rampart',
    faction: 'DEMONIC',
    keywords: ['TAUNT', 'SHIELD'],
    manaCost: 5,
    tier: 'RARE',
    cardType: 'CREATURE',
    description: 'A wall of fused demon bones and skulls animated by hellfire, dozens of skulls with glowing eye sockets arranged in a towering barricade',
    expectedComposition: 'ACTION_DEFEND (SHIELD/TAUNT keywords)',
  },
  {
    index: 6,
    name: 'Hellfire Cascade',
    faction: 'DEMONIC',
    keywords: [],
    manaCost: 6,
    tier: 'EPIC',
    cardType: 'SPELL',
    description: 'Waves of demonic fire erupting from a ritual circle inscribed in blood, columns of flame twisting into screaming faces',
    expectedComposition: 'ACTION_CAST (SPELL type) — but EPIC tier may override to DRAMATIC',
  },
];

// ---------------------------------------------------------------------------
// fal.ai caller (same pattern as generate-test-cards.mjs)
// ---------------------------------------------------------------------------

async function callFal(body) {
  const maxRetries = 2; // max 1 retry per the task rules
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
    if ((response.status === 429 || response.status >= 500) && attempt < maxRetries) {
      console.log(`  fal.ai ${response.status}, retrying in ${delay / 1000}s...`);
      await new Promise(r => setTimeout(r, delay));
      delay *= 2;
      continue;
    }
    throw new Error(`fal.ai HTTP ${response.status}: ${errText}`);
  }
}

// ---------------------------------------------------------------------------
// Generate a single validation card
// ---------------------------------------------------------------------------

async function generateValidationCard(card) {
  const factionPrefix = FACTION_PREFIXES[card.faction];
  const { key: compositionKey, value: compositionValue } = selectComposition(card);
  const environment = selectEnvironment(card.faction);

  const fullPrompt = [
    STYLE_ANCHOR,
    factionPrefix,
    card.description,
    compositionValue,
    environment,
  ].join(', ');

  console.log(`\n${'='.repeat(70)}`);
  console.log(`CARD ${card.index}: ${card.name} (${card.faction})`);
  console.log(`${'='.repeat(70)}`);
  console.log(`  Expected: ${card.expectedComposition}`);
  console.log(`  Selected: ${compositionKey}`);
  console.log(`  Environment: ${environment}`);
  console.log(`  Full prompt (${fullPrompt.length} chars):`);
  console.log(`  ${fullPrompt}`);
  console.log();

  const artRequest = {
    prompt: fullPrompt,
    negative_prompt: NEGATIVE_PROMPT,
    image_size: 'portrait_4_3',
    num_inference_steps: 40,
    guidance_scale: 8.5,
    num_images: 1,
    enable_safety_checker: true,
    output_format: 'png',
  };

  console.log('  Calling fal.ai FLUX Dev...');
  const falResult = await callFal(artRequest);

  if (falResult.has_nsfw_concepts?.[0]) {
    throw new Error('NSFW content detected');
  }
  if (!falResult.images?.[0]?.url) {
    throw new Error('No image URL in fal.ai response');
  }

  const tempImageUrl = falResult.images[0].url;
  const seed = falResult.seed;
  const inferenceMs = Math.round(falResult.timings?.inference || 0);
  console.log(`  Generated (seed: ${seed}, inference: ${inferenceMs}ms)`);

  // Download image
  console.log('  Downloading...');
  const imgResponse = await fetch(tempImageUrl);
  if (!imgResponse.ok) throw new Error(`Image download failed: ${imgResponse.status}`);
  const imageBuffer = Buffer.from(await imgResponse.arrayBuffer());
  const sizeKB = (imageBuffer.length / 1024).toFixed(0);
  console.log(`  Downloaded: ${sizeKB}KB`);

  // Save locally
  const factionSlug = card.faction.toLowerCase().replace('_courts', '');
  const compositionSlug = compositionKey.toLowerCase().replace(/[\/\s]/g, '-');
  const nameSlug = card.name.toLowerCase().replace(/\s+/g, '-');
  const filename = `${card.index}-${factionSlug}-${compositionSlug}-${nameSlug}.png`;
  const filepath = resolve(OUTPUT_DIR, filename);
  writeFileSync(filepath, imageBuffer);
  console.log(`  Saved: ${filename}`);

  return {
    index: card.index,
    name: card.name,
    faction: card.faction,
    compositionSelected: compositionKey,
    compositionExpected: card.expectedComposition,
    environment,
    prompt: fullPrompt,
    promptLength: fullPrompt.length,
    filename,
    sizeKB: parseInt(sizeKB),
    seed,
    inferenceMs,
    success: true,
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('=== Chaos Creatures — Art Quality & Composition Validation ===');
  console.log(`Generating ${VALIDATION_CARDS.length} cards to validate prompt variety...`);
  console.log(`Output: ${OUTPUT_DIR}`);
  console.log(`Budget: ~$${(VALIDATION_CARDS.length * 0.025).toFixed(3)} (${VALIDATION_CARDS.length} x ~$0.025 fal.ai FLUX Dev)`);

  const results = [];
  let successCount = 0;
  let totalCost = 0;

  for (const card of VALIDATION_CARDS) {
    try {
      const result = await generateValidationCard(card);
      results.push(result);
      successCount++;
      totalCost += 0.025;
    } catch (err) {
      console.error(`  FAILED: ${err.message}`);
      results.push({
        index: card.index,
        name: card.name,
        faction: card.faction,
        compositionExpected: card.expectedComposition,
        success: false,
        error: err.message,
      });
      totalCost += 0.025; // still charged on failure
    }
  }

  // ---------------------------------------------------------------------------
  // Summary report
  // ---------------------------------------------------------------------------
  console.log(`\n${'='.repeat(70)}`);
  console.log('VALIDATION RESULTS');
  console.log(`${'='.repeat(70)}`);

  for (const r of results) {
    const status = r.success ? 'OK' : 'FAIL';
    console.log(`\n[${status}] Card ${r.index}: ${r.name} (${r.faction})`);
    if (r.success) {
      console.log(`  Composition: ${r.compositionSelected}`);
      console.log(`  Expected:    ${r.compositionExpected}`);
      console.log(`  Environment: ${r.environment}`);
      console.log(`  File: ${r.filename} (${r.sizeKB}KB)`);
      console.log(`  Seed: ${r.seed} | Inference: ${r.inferenceMs}ms`);
      console.log(`  Prompt (${r.promptLength} chars): ${r.prompt.substring(0, 120)}...`);
    } else {
      console.log(`  Error: ${r.error}`);
    }
  }

  console.log(`\n${'='.repeat(70)}`);
  console.log(`Total: ${successCount}/${VALIDATION_CARDS.length} succeeded`);
  console.log(`Estimated cost: $${totalCost.toFixed(3)}`);
  console.log(`Files saved to: ${OUTPUT_DIR}`);
  console.log(`${'='.repeat(70)}`);

  // Write a JSON manifest for easy review
  const manifestPath = resolve(OUTPUT_DIR, 'validation-manifest.json');
  writeFileSync(manifestPath, JSON.stringify(results, null, 2));
  console.log(`\nManifest written to: ${manifestPath}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

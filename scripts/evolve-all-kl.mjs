#!/usr/bin/env node
// evolve-all-kl.mjs — Evolve all 18 base cards using FLUX Kontext + LoRA
// Pipeline: Kontext-LoRA (scale 2.0), surgical prompts, style suffix.
//
// Usage: node scripts/evolve-all-kl.mjs --manifest scripts/preview/BASE-iron-r1-manifest.json

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PREVIEW_DIR = join(__dirname, 'preview');

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
if (!FAL_KEY) { console.error('Missing FAL_KEY'); process.exit(1); }

// CLI
function getArg(name) {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx === -1 || !process.argv[idx + 1]) return null;
  return process.argv[idx + 1];
}
const MANIFEST_PATH = getArg('manifest');
if (!MANIFEST_PATH) { console.error('Missing --manifest'); process.exit(1); }

// Config
const LORA_URL = 'https://huggingface.co/EldritchAdam/SDXL_Eldritch_LoRAs/resolve/main/EldritchPaletteKnife.safetensors';
const LORA_SCALE = 2.0;

const STYLE_SUFFIX =
  'Keep the same color palette and lighting. ' +
  'Maintain thick palette knife oil painting style with visible heavy brushstrokes and impasto texture. ' +
  'Do not change the background, composition, or camera angle.';

// ==========================================================================
// Surgical evolution prompts — short, specific physical additions
// 2 variants per direction per faction for variety
// ==========================================================================

const ORDER_PROMPTS = {
  IRONWRIGHT: [
    'Add reinforced iron armor plates bolted over the shoulders and chest. Add glowing reactor crystal nodes at every joint. Add a structured halo of orbiting hydraulic components floating behind the head.',
    'Add polished chrome reinforcement panels over the torso. Add geometric blue rune etchings across the hull. Add a crown of iron sensor masts rising from the skull.',
  ],
  FEY_COURTS: [
    'Add golden crystalline patterns along the wing and limb edges. Add a small crown of amber light floating above the head. Add faint silver sigils glowing across the skin.',
    'Add a suit of bark-plate armor growing over the body in geometric patterns. Add glowing golden sap veins pulsing beneath the surface. Add new leaf-wing structures sprouting from the back.',
  ],
  DEMONIC: [
    'Add dark obsidian crystal growths on the shoulders. Add glowing infernal runes etched into the chest armor. Add longer sharper spiraling horns.',
    'Add chains fused into the body forming living armor with burning sigil links. Add a third eye glowing molten gold on the forehead. Add bone spur pauldrons on the shoulders.',
  ],
};

const CHAOS_PROMPTS = {
  IRONWRIGHT: [
    'Add cracked glowing red vents along the torso. Add extra exhaust pipes belching wild uncontrolled flames from the back. Add sparking exposed wires bursting from the joints.',
    'Add pistons pumping through cracks in the hull. Add one arm mutated into an oversized cannon barrel glowing red hot. Add bolts and rivets popping loose across the strained body.',
  ],
  FEY_COURTS: [
    'Add jagged thorns erupting from the joints and spine. Add glowing green-purple veins cracking through the bark. Add toxic mushrooms sprouting from the shoulders.',
    'Add extra branches sprouting at unnatural angles. Add blood-red and toxic purple leaves replacing the original foliage. Add a cloud of glowing spores emanating from the body.',
  ],
  DEMONIC: [
    'Add deep glowing lava cracks split across the entire body. Add a massive corona of wild hellfire erupting from the back and shoulders. Add new smaller horns sprouting along the spine.',
    'Add extra eyes opening across the body glowing different colors. Add new bone spurs and extra clawed appendages bursting through the skin. Add dark energy radiating in visible shockwaves.',
  ],
};

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function getEvolutionPrompt(factionKey) {
  const direction = Math.random() < 0.5 ? 'ORDER' : 'CHAOS';
  const pool = direction === 'ORDER' ? ORDER_PROMPTS : CHAOS_PROMPTS;
  const prompts = pool[factionKey] || pool.IRONWRIGHT;
  return { direction, instruction: pick(prompts) };
}

// ==========================================================================
// Kontext-LoRA API
// ==========================================================================

async function callKontextLora(body) {
  const maxRetries = 3;
  let delay = 3000;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch('https://fal.run/fal-ai/flux-kontext-lora', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${FAL_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    if (response.ok) return await response.json();
    const errText = await response.text();
    if (response.status === 422) throw new Error(`Kontext-LoRA 422: ${errText}`);
    if ((response.status === 429 || response.status >= 500) && attempt < maxRetries) {
      console.log(`    ${response.status}, retrying in ${delay / 1000}s...`);
      await new Promise(r => setTimeout(r, delay));
      delay *= 2;
      continue;
    }
    throw new Error(`Kontext-LoRA HTTP ${response.status}: ${errText}`);
  }
}

// ==========================================================================
// Evolve one card
// ==========================================================================

async function evolveCard(card) {
  const { direction, instruction } = getEvolutionPrompt(card.faction);
  const baseImagePath = join(PREVIEW_DIR, card.fileName);
  if (!existsSync(baseImagePath)) {
    throw new Error(`Base image not found: ${baseImagePath}`);
  }

  const baseBuffer = readFileSync(baseImagePath);
  const dataUri = `data:image/png;base64,${baseBuffer.toString('base64')}`;

  const prompt = instruction + ' ' + STYLE_SUFFIX;

  console.log(`  [${direction}] ${card.archetype || card.originalArchetype}`);

  const t0 = Date.now();
  const result = await callKontextLora({
    image_url: dataUri,
    prompt,
    loras: [{ path: LORA_URL, scale: LORA_SCALE }],
    guidance_scale: 2.5,
    num_inference_steps: 28,
    output_format: 'png',
    enable_safety_checker: true,
  });
  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);

  if (result.has_nsfw_concepts?.[0]) {
    throw new Error('NSFW detected');
  }
  if (!result.images?.[0]?.url) {
    throw new Error('No image URL in response');
  }

  const imgResponse = await fetch(result.images[0].url);
  if (!imgResponse.ok) throw new Error(`Download failed: ${imgResponse.status}`);
  const imageBuffer = Buffer.from(await imgResponse.arrayBuffer());

  const evoFileName = card.fileName.replace('.png', '-evo-kl.png');
  const evoPath = join(PREVIEW_DIR, evoFileName);
  writeFileSync(evoPath, imageBuffer);
  console.log(`  Saved: ${evoFileName} (${(imageBuffer.length / 1024).toFixed(0)}KB, seed: ${result.seed}, ${elapsed}s)`);

  return {
    agent: card.agent,
    run: card.run,
    fileName: evoFileName,
    baseFileName: card.fileName,
    specId: card.specId,
    faction: card.faction,
    archetype: card.archetype,
    originalArchetype: card.originalArchetype || card.archetype,
    composition: card.composition,
    rarity: 'UNCOMMON',
    baseRarity: 'COMMON',
    keywords: card.keywords,
    manaCost: card.manaCost,
    seed: result.seed,
    direction,
    type: 'evolution',
    pipeline: 'kontext-lora',
    loraScale: LORA_SCALE,
  };
}

// ==========================================================================
// Main
// ==========================================================================

async function main() {
  const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf-8'));
  console.log(`\n=== Evolving ${manifest.length} cards (Kontext+LoRA @ ${LORA_SCALE}) ===\n`);

  const results = [];
  for (const card of manifest) {
    if (card.error) { console.log(`  Skipping ${card.specId} (had error)`); continue; }
    try {
      const evo = await evolveCard(card);
      results.push(evo);
    } catch (err) {
      console.error(`  FAILED: ${card.archetype || card.specId} — ${err.message}`);
      results.push({ ...card, error: err.message, type: 'evolution' });
    }
  }

  // Save evolution manifest
  const evoManifestName = MANIFEST_PATH.replace(/-manifest\.json$/, '-evo-kl-manifest.json')
    .replace(/^.*\//, '');
  const evoManifestPath = join(PREVIEW_DIR, evoManifestName);
  writeFileSync(evoManifestPath, JSON.stringify(results, null, 2));
  console.log(`\nManifest: ${evoManifestName}`);
  console.log(`Evolved: ${results.filter(r => !r.error).length}/${manifest.length} cards`);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});

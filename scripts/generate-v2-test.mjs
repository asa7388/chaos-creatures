#!/usr/bin/env node
// generate-v2-test.mjs — V2 prompt strategy test
// Key changes from v1:
//   1. SHORT prompts (~60-70 tokens, under CLIP's 77 token limit)
//   2. Scene-first descriptions (action/moment, not character sheets)
//   3. No composition prefix/suffix system — composition baked into the scene
//   4. No weather/time/scale/gear stacking
//   5. Creature is part of a SCENE, not a portrait subject

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, 'preview', 'pool-v2');
if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

// Load FAL_KEY
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

// === LOCKED RECIPE ===
const LORA_URL = 'https://huggingface.co/EldritchAdam/SDXL_Eldritch_LoRAs/resolve/main/EldritchPaletteKnife.safetensors';
const LORA_SCALE = 0.9;

// V2: Shorter style anchor — let the LoRA do most of the style work
const STYLE = 'oil painting, dark fantasy, palette knife impasto, chiaroscuro';

const NEG = 'digital art, 3d render, photorealistic, smooth gradients, airbrushed, ' +
  'anime, cartoon, watermark, text, borders, frames, ' +
  'symmetrical centered portrait, T-pose, white background, ' +
  'nudity, nsfw';

// V2 CREATURE POOL: Scene-first, ~20-30 words max, action/moment not character sheet
// Each entry has: name, scene (short!), faction
const CARDS = [
  // IRONWRIGHT — brutalist space-industrial
  {
    name: 'Reactor Warden',
    scene: 'A massive iron golem bracing against an explosion in a reactor chamber, molten coolant spraying, orange warning lights, concrete walls cracking',
    faction: 'IRONWRIGHT',
  },
  {
    name: 'Strip-Mine Scout',
    scene: 'A small wiry automaton descending alone into a vast strip-mine pit on a cable, headlamp cutting through dust, seen from above, tiny against the abyss',
    faction: 'IRONWRIGHT',
  },
  // FEY COURTS — dark nature
  {
    name: 'Rootmaw Lurker',
    scene: 'A predatory tree-root beast lunging from a dark hollow, thorn-lined vertical mouth splitting open, gnarled branches like claws, bioluminescent fungi on its bark',
    faction: 'FEY_COURTS',
  },
  {
    name: 'Thorn Sprite',
    scene: 'A tiny malicious thorn-covered pixie riding a giant bark beetle through fallen autumn leaves, needle fingers reaching forward, insect wings of dried leaves',
    faction: 'FEY_COURTS',
  },
  // DEMONIC — hellfire and corruption
  {
    name: 'Slag Brute',
    scene: 'A misshapen creature of cooled volcanic slag smashing through an obsidian wall, molten cracks glowing across its body, one shoulder grotesquely oversized, half-melted skull',
    faction: 'DEMONIC',
  },
  {
    name: 'Infernal Advocate',
    scene: 'A gaunt horned demon in crimson robes seated at an obsidian desk, weighing a glowing soul on golden scales, burning contract scrolls floating around it, hellfire candlelight',
    faction: 'DEMONIC',
  },
  // CELESTIAL CRUSADE — divine radiance
  {
    name: 'Prayer Lantern',
    scene: 'A golden winged censer floating in a dark cathedral, divine light pouring through its latticed body, casting prismatic patterns on marble columns, tiny and luminous',
    faction: 'CELESTIAL_CRUSADE',
  },
  {
    name: 'Blessed Squire',
    scene: 'A young crusader in white-and-gold plate kneeling to plant a sword before a towering statue of divine judgment, golden halo forming above, light streaming from above',
    faction: 'CELESTIAL_CRUSADE',
  },
  // THE ENDLESS — undead, spectral
  {
    name: 'Grave Wisp',
    scene: 'A cluster of pale green-purple spirit flames drifting through a moonlit necropolis, tiny skull faces flickering inside each flame, bone fragments orbiting, mist trailing below',
    faction: 'THE_ENDLESS',
  },
  {
    name: 'Bone Crawler',
    scene: 'A six-legged skeletal construct skittering across a crumbling tomb ceiling, pulsing green crystal embedded in its fused ribcage, multi-eyed skull clicking, seen from below',
    faction: 'THE_ENDLESS',
  },
];

// Faction environments — ONE per card, short
const ENVS = {
  IRONWRIGHT: [
    'inside a collapsing reactor chamber with ruptured pipes and emergency strobes',
    'in a vast planetary strip-mine, terraced excavation descending into darkness',
  ],
  FEY_COURTS: [
    'in a dark ancient forest, gnarled roots and bioluminescent mushrooms',
    'in a twilight meadow of giant wildflowers and drifting fireflies',
  ],
  DEMONIC: [
    'in a volcanic throne room built from titan bones, hellfire braziers burning',
    'inside an obsidian bureaucratic chamber, soul-jars on shelves, dim green light',
  ],
  CELESTIAL_CRUSADE: [
    'in a vast dark cathedral, light filtering through stained glass',
    'on the steps of a marble citadel, clouds below, golden light above',
  ],
  THE_ENDLESS: [
    'in a moonlit necropolis of crumbling mausoleums, spectral light seeping from tombs',
    'inside a collapsing crypt, cobwebs of darkness, fading necromantic runes on walls',
  ],
};

// fal.ai queue mode
function curlPost(url, body, timeoutSec = 60) {
  const tmpFile = `/tmp/fal-v2-${Date.now()}-${Math.random().toString(36).slice(2)}.json`;
  writeFileSync(tmpFile, JSON.stringify(body));
  try {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const result = execFileSync('curl', [
          '-s', '--max-time', String(timeoutSec),
          '-X', 'POST', url,
          '-H', `Authorization: Key ${FAL_KEY}`,
          '-H', 'Content-Type: application/json',
          '-d', `@${tmpFile}`,
        ], { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });
        return JSON.parse(result);
      } catch (err) {
        if (attempt < 2) execFileSync('sleep', [String(3 * (attempt + 1))]);
        else throw err;
      }
    }
  } finally {
    try { execFileSync('rm', [tmpFile]); } catch {}
  }
}

function curlGet(url, timeoutSec = 30) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const result = execFileSync('curl', [
        '-s', '--max-time', String(timeoutSec),
        '-H', `Authorization: Key ${FAL_KEY}`,
        url,
      ], { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });
      return JSON.parse(result);
    } catch (err) {
      if (attempt < 2) execFileSync('sleep', [String(2 * (attempt + 1))]);
      else throw err;
    }
  }
}

async function callFal(body) {
  const endpoint = 'fal-ai/fast-sdxl';
  const submitResult = curlPost(`https://queue.fal.run/${endpoint}`, body, 60);
  if (submitResult.detail) throw new Error(`fal.ai submit: ${JSON.stringify(submitResult.detail)}`);
  const requestId = submitResult.request_id;
  if (!requestId) throw new Error(`No request_id: ${JSON.stringify(submitResult)}`);

  const pollUrl = `https://queue.fal.run/${endpoint}/requests/${requestId}/status`;
  const t0 = Date.now();
  while (true) {
    let status;
    try { status = curlGet(pollUrl, 20); } catch { execFileSync('sleep', ['3']); continue; }
    if (status.status === 'COMPLETED') break;
    if (status.status === 'FAILED') throw new Error(`Failed: ${JSON.stringify(status)}`);
    execFileSync('sleep', ['2']);
  }
  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);

  const resultUrl = `https://queue.fal.run/${endpoint}/requests/${requestId}`;
  const result = curlGet(resultUrl, 60);
  if (result.detail) throw new Error(`fal.ai fetch: ${JSON.stringify(result.detail)}`);
  console.log(`    fal.ai: ${elapsed}s`);
  return result;
}

// === MAIN ===
async function main() {
  console.log('\n=== V2 Prompt Strategy Test (10 cards) ===\n');
  console.log('Changes: shorter prompts, scene-first, no composition system');
  console.log(`Cost: ~$${(CARDS.length * 0.025).toFixed(2)}\n`);

  const results = [];
  let envIdx = {};

  for (let i = 0; i < CARDS.length; i++) {
    const card = CARDS[i];
    // Pick environment (alternate between the two per faction)
    if (!envIdx[card.faction]) envIdx[card.faction] = 0;
    const env = ENVS[card.faction][envIdx[card.faction] % ENVS[card.faction].length];
    envIdx[card.faction]++;

    // V2 prompt: scene + style + environment — that's it. ~60 tokens.
    const prompt = `${card.scene}, ${env}, ${STYLE}`;

    const factionSlug = card.faction.toLowerCase().replace(/_/g, '-');
    const fileName = `V2-${factionSlug}-${String(i + 1).padStart(2, '0')}.png`;
    console.log(`[${i + 1}/${CARDS.length}] ${card.name} (${card.faction})`);
    console.log(`    Prompt tokens: ~${prompt.split(/\s+/).length} words`);

    if (existsSync(join(OUT_DIR, fileName))) {
      console.log('    Already exists, skipping');
      results.push({ index: i + 1, fileName, name: card.name, faction: card.faction, skipped: true });
      continue;
    }

    try {
      const result = await callFal({
        prompt,
        negative_prompt: NEG,
        image_size: 'portrait_4_3',
        num_inference_steps: 25,
        guidance_scale: 7.5,
        num_images: 1,
        enable_safety_checker: true,
        format: 'png',
        loras: [{ path: LORA_URL, scale: LORA_SCALE }],
      });

      if (result.has_nsfw_concepts?.[0]) {
        console.log('    NSFW flagged, skipping');
        results.push({ index: i + 1, name: card.name, faction: card.faction, error: 'NSFW' });
        continue;
      }
      if (!result.images?.[0]?.url) {
        console.log('    No image URL');
        results.push({ index: i + 1, name: card.name, faction: card.faction, error: 'No image' });
        continue;
      }

      const img = await fetch(result.images[0].url);
      const buf = Buffer.from(await img.arrayBuffer());
      writeFileSync(join(OUT_DIR, fileName), buf);
      console.log(`    Saved: ${fileName} (${(buf.length / 1024).toFixed(0)}KB, seed: ${result.seed})`);

      results.push({
        index: i + 1, fileName, name: card.name, faction: card.faction,
        seed: result.seed, sizeKB: Math.round(buf.length / 1024),
        promptWords: prompt.split(/\s+/).length,
      });
    } catch (err) {
      console.error(`    FAILED: ${err.message}`);
      results.push({ index: i + 1, name: card.name, faction: card.faction, error: err.message });
    }
  }

  // Save manifest
  writeFileSync(join(OUT_DIR, 'manifest.json'), JSON.stringify(results, null, 2));

  const ok = results.filter(r => !r.error && !r.skipped).length;
  console.log(`\n=== Complete: ${ok}/${CARDS.length} cards ===`);
  console.log(`Images: ${OUT_DIR}/`);
  console.log(`Est. cost: ~$${(ok * 0.025).toFixed(2)}`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });

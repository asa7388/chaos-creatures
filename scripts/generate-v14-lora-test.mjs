#!/usr/bin/env node
// generate-v14-lora-test.mjs — First test of custom CHSCRT FLUX LoRA
// Uses fal-ai/flux/dev with our trained style LoRA
// 10 cards: 2 per faction, all NEW creatures not in training set

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, 'preview', 'pool-v14');
if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

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

// Our trained LoRA
const LORA_URL = 'https://v3b.fal.media/files/b/0a8f209b/hUzJMCoRfQSuU0e4CDUS6_pytorch_lora_weights.safetensors';
const TRIGGER = 'CHSCRT style';

// Test cards — all NEW creatures/concepts not in the training set
const CARDS = [
  // IRONWRIGHT — new constructs
  {
    name: 'Drill Leviathan',
    prompt: `${TRIGGER}, a colossal drilling machine burrowing out of the earth at an angle, massive spinning drill head emerging from cracked ground, conveyor belts and ore processors along its segmented body, workers scrambling on scaffolding, dust clouds and debris, industrial wasteland`,
    faction: 'IRONWRIGHT',
    comp: 'ENV',
  },
  {
    name: 'Forge Priest',
    prompt: `${TRIGGER}, close-up portrait of an iron priest with a mask made of welded steel plates, glowing orange eyes behind slits, molten metal dripping from ritual tools held in gauntleted hands, furnace light from below illuminating the mask, dark industrial cathedral behind`,
    faction: 'IRONWRIGHT',
    comp: 'PORTRAIT',
  },

  // FEY COURTS — new nature spirits
  {
    name: 'Moth Oracle',
    prompt: `${TRIGGER}, an enormous luna moth with luminous green wings perched on a standing stone at night, tiny runes glowing on the stone where its legs touch, smaller moths orbiting it like satellites, misty moonlit meadow, ethereal and mysterious`,
    faction: 'FEY_COURTS',
    comp: 'OBJ',
  },
  {
    name: 'Root Wyrm',
    prompt: `${TRIGGER}, a massive serpentine creature made of twisted tree roots and vines bursting from the forest floor, soil cascading from its body, glowing amber sap dripping from its wooden fangs, crushing a stone wall as it emerges, birds fleeing the canopy above`,
    faction: 'FEY_COURTS',
    comp: 'ACT',
  },

  // DEMONIC — new fiends
  {
    name: 'Pit Hag',
    prompt: `${TRIGGER}, a withered demonic crone stirring an enormous iron cauldron suspended over a lava pit, her elongated shadow on the cavern wall shows a beautiful young woman, chains and bones hanging from the ceiling, hellish red and orange light, narrative scene`,
    faction: 'DEMONIC',
    comp: 'NAR',
  },
  {
    name: 'Magma Wurm',
    prompt: `${TRIGGER}, a titanic worm made of cooling magma and obsidian plates erupting from a volcanic mountainside, its body glowing orange through cracks in black rocky skin, lava streaming from its open mouth, distant city in the valley below for scale, apocalyptic sky`,
    faction: 'DEMONIC',
    comp: 'ENV',
  },

  // CELESTIAL — new divine beings
  {
    name: 'War Elephant',
    prompt: `${TRIGGER}, a massive armored war elephant with golden plate armor and divine symbols, carrying a howdah fortress on its back with angelic archers, trampling through a battlefield, trunk raised trumpeting, banner of light streaming from the howdah, dust and chaos of battle`,
    faction: 'CELESTIAL_CRUSADE',
    comp: 'ACT',
  },
  {
    name: 'The Pardoner',
    prompt: `${TRIGGER}, a skeletal angel in tattered white robes kneeling to touch the forehead of a chained prisoner in a dark dungeon, golden light emanating from the angel's fingertip, the prisoner's chains beginning to dissolve into light, intimate and solemn moment`,
    faction: 'CELESTIAL_CRUSADE',
    comp: 'NAR',
  },

  // THE ENDLESS — new undead
  {
    name: 'Grave Tide',
    prompt: `${TRIGGER}, a massive wave of skeletal hands and arms erupting from cemetery ground, hundreds of bony fingers reaching skyward like a frozen tidal wave, a lone gravedigger dropping his shovel and stumbling backward, green moonlight, fog rolling between headstones`,
    faction: 'THE_ENDLESS',
    comp: 'ENV',
  },
  {
    name: 'Soul Lantern',
    prompt: `${TRIGGER}, an ornate iron lantern floating in darkness, inside the glass a trapped ghostly face presses against the pane screaming silently, the lantern's light casting long shadows down a cobblestone street, chain dangling below, rain falling, Victorian gaslit atmosphere`,
    faction: 'THE_ENDLESS',
    comp: 'OBJ',
  },
];

function curlPost(url, body, timeoutSec = 120) {
  const tmpFile = `/tmp/fal-v14-${Date.now()}-${Math.random().toString(36).slice(2)}.json`;
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
  const endpoint = 'fal-ai/flux-lora';
  const submitResult = curlPost(`https://queue.fal.run/${endpoint}`, body, 120);
  if (submitResult.detail) throw new Error(`fal.ai submit: ${JSON.stringify(submitResult.detail)}`);
  const requestId = submitResult.request_id;
  if (!requestId) throw new Error(`No request_id: ${JSON.stringify(submitResult)}`);
  const pollUrl = `https://queue.fal.run/${endpoint}/requests/${requestId}/status`;
  while (true) {
    let status;
    try { status = curlGet(pollUrl, 20); } catch { execFileSync('sleep', ['3']); continue; }
    if (status.status === 'COMPLETED') break;
    if (status.status === 'FAILED') throw new Error(`Failed: ${JSON.stringify(status)}`);
    execFileSync('sleep', ['3']);
  }
  const resultUrl = `https://queue.fal.run/${endpoint}/requests/${requestId}`;
  const result = curlGet(resultUrl, 60);
  if (result.detail) throw new Error(`fal.ai fetch: ${JSON.stringify(result.detail)}`);
  return result;
}

async function main() {
  console.log('\n=== V14 Custom LoRA Test (10 cards) ===\n');
  console.log('Model: FLUX dev + CHSCRT style LoRA');
  console.log('All NEW creatures not in training set');
  console.log(`Cost: ~$${(CARDS.length * 0.035).toFixed(2)} (FLUX dev is ~$0.035/image)\n`);

  const results = [];
  for (let i = 0; i < CARDS.length; i++) {
    const card = CARDS[i];
    const typeSlug = card.faction.toLowerCase().replace(/_/g, '-');
    const fileName = `V14-${typeSlug}-${String(i + 1).padStart(2, '0')}.png`;
    console.log(`[${i + 1}/${CARDS.length}] ${card.name} (${card.faction}) [${card.comp}]`);

    if (existsSync(join(OUT_DIR, fileName))) {
      console.log('    Already exists, skipping');
      results.push({ index: i + 1, fileName, name: card.name, faction: card.faction, comp: card.comp, type: 'CREATURE', skipped: true });
      continue;
    }

    try {
      const result = await callFal({
        prompt: card.prompt,
        image_size: { width: 768, height: 1024 },
        num_inference_steps: 28,
        guidance_scale: 3.5,
        num_images: 1,
        enable_safety_checker: true,
        output_format: 'png',
        loras: [{ path: LORA_URL, scale: 1.0 }],
      });

      if (result.has_nsfw_concepts?.[0] || !result.images?.[0]?.url) {
        console.log('    NSFW or no image, retrying with simpler prompt...');
        const retryResult = await callFal({
          prompt: `${TRIGGER}, ${card.name}, dark fantasy creature, oil painting`,
          image_size: { width: 768, height: 1024 },
          num_inference_steps: 28,
          guidance_scale: 3.5,
          num_images: 1,
          enable_safety_checker: true,
          output_format: 'png',
          loras: [{ path: LORA_URL, scale: 1.0 }],
        });
        if (!retryResult.images?.[0]?.url) {
          results.push({ index: i + 1, name: card.name, faction: card.faction, error: 'No image' });
          continue;
        }
        const img = await fetch(retryResult.images[0].url);
        const buf = Buffer.from(await img.arrayBuffer());
        writeFileSync(join(OUT_DIR, fileName), buf);
        console.log(`    Saved (retry): ${fileName} (${(buf.length / 1024).toFixed(0)}KB)`);
        results.push({ index: i + 1, fileName, name: card.name, faction: card.faction, comp: card.comp, type: 'CREATURE', seed: retryResult.seed, sizeKB: Math.round(buf.length / 1024) });
        continue;
      }

      const img = await fetch(result.images[0].url);
      const buf = Buffer.from(await img.arrayBuffer());
      writeFileSync(join(OUT_DIR, fileName), buf);
      console.log(`    Saved: ${fileName} (${(buf.length / 1024).toFixed(0)}KB, seed: ${result.seed})`);
      results.push({ index: i + 1, fileName, name: card.name, faction: card.faction, comp: card.comp, type: 'CREATURE', seed: result.seed, sizeKB: Math.round(buf.length / 1024) });
    } catch (err) {
      console.error(`    FAILED: ${err.message}`);
      results.push({ index: i + 1, name: card.name, faction: card.faction, error: err.message });
    }
  }

  writeFileSync(join(OUT_DIR, 'manifest.json'), JSON.stringify(results, null, 2));
  const ok = results.filter(r => !r.error && !r.skipped).length;
  console.log(`\n=== Complete: ${ok}/${CARDS.length} ===`);
  console.log(`Est. cost: ~$${(ok * 0.035).toFixed(2)}`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });

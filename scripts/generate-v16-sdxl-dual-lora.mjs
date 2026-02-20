#!/usr/bin/env node
// generate-v16-sdxl-dual-lora.mjs — SDXL + dual LoRA test
// Stacks our custom CHSCRT LoRA (trained on Replicate) + EldritchPaletteKnife
// Same 3 creatures from v15 for direct comparison

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, 'preview', 'pool-v16');
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

// Our SDXL LoRA (trained on Replicate)
const CHSCRT_LORA = 'https://pub-ab96c6d0742748d19e4ad5502f3fea09.r2.dev/training/chscrt-sdxl-lora.safetensors';
// EldritchPaletteKnife for oil painting texture
const PALETTE_KNIFE_LORA = 'https://huggingface.co/EldritchAdam/SDXL_Eldritch_LoRAs/resolve/main/EldritchPaletteKnife.safetensors';

const STYLE = 'oil painting, dark fantasy, palette knife impasto, defined brushwork, chiaroscuro';
const NEG = 'digital art, 3d render, photorealistic, smooth gradients, airbrushed, ' +
  'anime, cartoon, watermark, text, borders, frames, ' +
  'symmetrical centered portrait, T-pose, white background, ' +
  'dripping paint, melting, paint streaks, vertical streaks, runny paint, ' +
  'standing still, posing, facing camera, ' +
  'nudity, nsfw';

// Same 3 creatures from v15, plus 7 more for broader testing
const CREATURES = [
  // Same 3 from v15 for direct comparison
  {
    name: 'Forge Priest',
    prompt: `a painting in the style of CHSCRT, ${STYLE}, close-up portrait of an iron priest with a mask made of welded steel plates, glowing orange eyes behind slits, molten metal dripping from ritual tools held in gauntleted hands, furnace light from below illuminating the mask, dark industrial cathedral behind`,
    faction: 'IRONWRIGHT',
    comp: 'PORTRAIT',
  },
  {
    name: 'Root Wyrm',
    prompt: `a painting in the style of CHSCRT, ${STYLE}, a massive serpentine creature made of twisted tree roots and vines bursting from the forest floor, soil cascading from its body, glowing amber sap dripping from its wooden fangs, crushing a stone wall as it emerges, birds fleeing the canopy above`,
    faction: 'FEY_COURTS',
    comp: 'ACT',
  },
  {
    name: 'Grave Tide',
    prompt: `a painting in the style of CHSCRT, ${STYLE}, a massive wave of skeletal hands and arms erupting from cemetery ground, hundreds of bony fingers reaching skyward like a frozen tidal wave, a lone gravedigger dropping his shovel and stumbling backward, green moonlight, fog rolling between headstones`,
    faction: 'THE_ENDLESS',
    comp: 'ENV',
  },
  // 7 more to test breadth
  {
    name: 'Drill Leviathan',
    prompt: `a painting in the style of CHSCRT, ${STYLE}, a colossal drilling machine burrowing out of the earth at an angle, massive spinning drill head emerging from cracked ground, conveyor belts and ore processors along its segmented body, workers scrambling on scaffolding, dust clouds and debris, industrial wasteland`,
    faction: 'IRONWRIGHT',
    comp: 'ENV',
  },
  {
    name: 'Moth Oracle',
    prompt: `a painting in the style of CHSCRT, ${STYLE}, an enormous luna moth with luminous green wings perched on a standing stone at night, tiny runes glowing on the stone where its legs touch, smaller moths orbiting it like satellites, misty moonlit meadow, ethereal and mysterious`,
    faction: 'FEY_COURTS',
    comp: 'OBJ',
  },
  {
    name: 'Pit Hag',
    prompt: `a painting in the style of CHSCRT, ${STYLE}, a withered demonic crone stirring an enormous iron cauldron suspended over a lava pit, her elongated shadow on the cavern wall shows a beautiful young woman, chains and bones hanging from the ceiling, hellish red and orange light`,
    faction: 'DEMONIC',
    comp: 'NAR',
  },
  {
    name: 'Magma Wurm',
    prompt: `a painting in the style of CHSCRT, ${STYLE}, a titanic worm made of cooling magma and obsidian plates erupting from a volcanic mountainside, its body glowing orange through cracks in black rocky skin, lava streaming from its open mouth, distant city in the valley below for scale, apocalyptic sky`,
    faction: 'DEMONIC',
    comp: 'ENV',
  },
  {
    name: 'War Elephant',
    prompt: `a painting in the style of CHSCRT, ${STYLE}, a massive armored war elephant with golden plate armor and divine symbols, carrying a howdah fortress on its back with angelic archers, trampling through a battlefield, trunk raised trumpeting, banner of light streaming from the howdah, dust and chaos of battle`,
    faction: 'CELESTIAL_CRUSADE',
    comp: 'ACT',
  },
  {
    name: 'The Pardoner',
    prompt: `a painting in the style of CHSCRT, ${STYLE}, a skeletal angel in tattered white robes kneeling to touch the forehead of a chained prisoner in a dark dungeon, golden light emanating from the angel's fingertip, the prisoner's chains beginning to dissolve into light, intimate and solemn moment`,
    faction: 'CELESTIAL_CRUSADE',
    comp: 'NAR',
  },
  {
    name: 'Soul Lantern',
    prompt: `a painting in the style of CHSCRT, ${STYLE}, an ornate iron lantern floating in darkness, inside the glass a trapped ghostly face presses against the pane screaming silently, the lantern's light casting long shadows down a cobblestone street, chain dangling below, rain falling, Victorian gaslit atmosphere`,
    faction: 'THE_ENDLESS',
    comp: 'OBJ',
  },
];

// Test configs — solo CHSCRT at different scales (trained on palette knife images, should carry that style)
const CONFIGS = [
  { label: 'A', chscrt: 0.6, palette: 0 },
  { label: 'B', chscrt: 0.8, palette: 0 },
];

function curlPost(url, body, timeoutSec = 120) {
  const tmpFile = `/tmp/fal-v16-${Date.now()}-${Math.random().toString(36).slice(2)}.json`;
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
  // First 3 creatures get both configs (A and B), rest get config A only
  const jobs = [];
  for (let i = 0; i < CREATURES.length; i++) {
    const configs = i < 3 ? CONFIGS : [CONFIGS[0]];
    for (const cfg of configs) {
      jobs.push({ creature: CREATURES[i], config: cfg, index: i + 1 });
    }
  }

  console.log(`\n=== V16 SDXL Dual-LoRA Test (${jobs.length} images) ===\n`);
  console.log('LoRA stack: CHSCRT (Replicate-trained) + EldritchPaletteKnife');
  console.log(`Config A: CHSCRT ${CONFIGS[0].chscrt} + PaletteKnife ${CONFIGS[0].palette}`);
  console.log(`Config B: CHSCRT ${CONFIGS[1].chscrt} + PaletteKnife ${CONFIGS[1].palette}`);
  console.log(`Cost: ~$${(jobs.length * 0.025).toFixed(2)}\n`);

  const results = [];
  for (let j = 0; j < jobs.length; j++) {
    const { creature, config, index } = jobs[j];
    const typeSlug = creature.faction.toLowerCase().replace(/_/g, '-');
    const nameSlug = creature.name.toLowerCase().replace(/\s+/g, '-');
    const fileName = `V16-${typeSlug}-${nameSlug}-${config.label}.png`;
    console.log(`[${j + 1}/${jobs.length}] ${creature.name} config ${config.label} (CHSCRT:${config.chscrt} PK:${config.palette})`);

    if (existsSync(join(OUT_DIR, fileName))) {
      console.log('    Already exists, skipping');
      results.push({ index, fileName, name: creature.name, faction: creature.faction, comp: creature.comp, config: config.label, chscrtScale: config.chscrt, paletteScale: config.palette, skipped: true });
      continue;
    }

    try {
      const result = await callFal({
        prompt: creature.prompt,
        negative_prompt: NEG,
        image_size: 'portrait_4_3',
        num_inference_steps: 30,
        guidance_scale: 7.5,
        num_images: 1,
        enable_safety_checker: true,
        output_format: 'png',
        loras: config.palette > 0
          ? [
              { path: CHSCRT_LORA, scale: config.chscrt },
              { path: PALETTE_KNIFE_LORA, scale: config.palette },
            ]
          : [
              { path: CHSCRT_LORA, scale: config.chscrt },
            ],
      });

      if (result.has_nsfw_concepts?.[0] || !result.images?.[0]?.url) {
        console.log('    NSFW or no image');
        results.push({ index, name: creature.name, faction: creature.faction, config: config.label, error: 'No image / NSFW' });
        continue;
      }

      const img = await fetch(result.images[0].url);
      const buf = Buffer.from(await img.arrayBuffer());
      writeFileSync(join(OUT_DIR, fileName), buf);
      console.log(`    Saved: ${fileName} (${(buf.length / 1024).toFixed(0)}KB, seed: ${result.seed})`);
      results.push({ index, fileName, name: creature.name, faction: creature.faction, comp: creature.comp, config: config.label, chscrtScale: config.chscrt, paletteScale: config.palette, seed: result.seed, sizeKB: Math.round(buf.length / 1024) });
    } catch (err) {
      console.error(`    FAILED: ${err.message}`);
      results.push({ index, name: creature.name, faction: creature.faction, config: config.label, error: err.message });
    }
  }

  writeFileSync(join(OUT_DIR, 'manifest.json'), JSON.stringify(results, null, 2));
  const ok = results.filter(r => !r.error && !r.skipped).length;
  console.log(`\n=== Complete: ${ok}/${jobs.length} ===`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });

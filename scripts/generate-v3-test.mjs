#!/usr/bin/env node
// generate-v3-test.mjs — V3 prompt strategy
// Changes from v2:
//   1. LoRA scale 0.9 → 0.65 (reduce dripping paint effect)
//   2. Negative prompt includes "dripping paint, melting, paint streaks, vertical streaks"
//   3. Mix of composition types based on keeper analysis:
//      - Environmental/scale (creature tiny in vast scene)
//      - Narrative (creature doing something specific)
//      - Object-creature (the creature IS an artifact/construct)
//      - Close-up action (creature mid-action, cropped tight)
//      - Heroic pose (standing with architectural depth)
//   4. All new creature types — no repeats from v1/v2
//   5. 2 Planar Ruins at the end

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, 'preview', 'pool-v3');
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

// === V3 RECIPE ===
const LORA_URL = 'https://huggingface.co/EldritchAdam/SDXL_Eldritch_LoRAs/resolve/main/EldritchPaletteKnife.safetensors';
const LORA_SCALE = 0.65; // Down from 0.9 — reduces dripping/pulling effect

const STYLE = 'oil painting, dark fantasy, palette knife impasto, defined brushwork, chiaroscuro';

const NEG = 'digital art, 3d render, photorealistic, smooth gradients, airbrushed, ' +
  'anime, cartoon, watermark, text, borders, frames, ' +
  'symmetrical centered portrait, T-pose, white background, ' +
  'dripping paint, melting, paint streaks, vertical streaks, runny paint, ' +
  'nudity, nsfw';

// V3 CARDS: Different creature types, varied compositions
// Composition types tagged for tracking: ENV (environmental/scale), NAR (narrative), OBJ (object-creature), ACT (action close-up), HERO (heroic pose)
const CARDS = [
  // IRONWRIGHT — brutalist space-industrial
  {
    name: 'Gravity Anchor',
    scene: 'A massive spherical iron device embedded in a crater, crackling with blue energy arcs, chains radiating outward into the ground, workers ant-sized beside it',
    faction: 'IRONWRIGHT',
    comp: 'ENV', // environmental scale — object dwarfs tiny figures
  },
  {
    name: 'Rebar Hound',
    scene: 'A wolf-like construct of twisted rebar and concrete lunging through a breach in a factory wall, sparks flying from its joints, hydraulic pistons for legs, glowing sensor eye',
    faction: 'IRONWRIGHT',
    comp: 'ACT', // action close-up
  },
  // FEY COURTS — dark nature
  {
    name: 'Hollow Stag',
    scene: 'A spectral stag with antlers of dead white birch standing in a frozen black lake, reflection showing a different creature beneath the ice, moonlight through bare trees',
    faction: 'FEY_COURTS',
    comp: 'NAR', // narrative — the reflection tells a story
  },
  {
    name: 'Mycelium Weaver',
    scene: 'A hunched fungal creature crouched over a fallen log, thin luminous threads spreading from its fingers into the wood, tiny mushrooms sprouting where threads touch, cave-like forest floor',
    faction: 'FEY_COURTS',
    comp: 'NAR', // narrative — creature doing something
  },
  // DEMONIC — hellfire and corruption
  {
    name: 'Chain Warden',
    scene: 'A towering jailer demon dragging a massive chain through a prison of hanging cages, molten links glowing red, prisoners reaching through bars, seen from below through cage bars',
    faction: 'DEMONIC',
    comp: 'ENV', // environmental — seen from below through cage bars
  },
  {
    name: 'Ember Imp',
    scene: 'A tiny cackling imp perched on a skull, juggling three balls of hellfire, its skin cracked like cooling magma, tail curled around the skull jaw, firelight casting long shadows',
    faction: 'DEMONIC',
    comp: 'OBJ', // object-creature — small, perched on something
  },
  // CELESTIAL CRUSADE — divine radiance
  {
    name: 'War Seraph',
    scene: 'A six-winged angel in battle-scarred golden armor descending from storm clouds with a flaming sword raised, divine light breaking through clouds behind, feathers scattering',
    faction: 'CELESTIAL_CRUSADE',
    comp: 'HERO', // heroic descent
  },
  {
    name: 'Sanctum Keeper',
    scene: 'A stone-faced sentinel embedded in a cathedral wall coming to life, one massive arm pulling free from the masonry, cracks of golden light spreading from its joints, dust and rubble falling',
    faction: 'CELESTIAL_CRUSADE',
    comp: 'ACT', // action — emerging from wall
  },
  // THE ENDLESS — undead, spectral
  {
    name: 'Lich Sovereign',
    scene: 'A skeletal figure in tattered royal robes seated on a throne of fused bones, one hand raised commanding a swirl of ghostly green souls, crown of black iron, phylactery glowing on chest',
    faction: 'THE_ENDLESS',
    comp: 'NAR', // narrative — commanding souls from throne
  },
  {
    name: 'Carrion Swarm',
    scene: 'A dense cloud of skeletal birds descending on a battlefield graveyard, hundreds of tiny bone-wing shapes against a sickly green sky, tombstones below, seen from a distance',
    faction: 'THE_ENDLESS',
    comp: 'ENV', // environmental scale — swarm as collective entity
  },

  // === PLANAR RUINS ===
  {
    name: 'Wellspring of Echoes',
    scene: 'An ancient circular stone well in a vast empty cavern, pale blue crystalline water overflowing and floating upward as droplets of light, runic carvings on the well rim, no people, alien architecture',
    faction: 'NEUTRAL',
    comp: 'OBJ', // object — the ruin IS the subject
    type: 'PLANAR_RUIN',
  },
  {
    name: 'Shattered Obelisk',
    scene: 'A towering cracked obelisk of dark stone hovering in fragments above a glowing fissure in the ground, arcane symbols on each floating piece, energy arcing between fragments, desolate rocky landscape',
    faction: 'NEUTRAL',
    comp: 'ENV', // environmental — large structure in landscape
    type: 'PLANAR_RUIN',
  },
];

// fal.ai queue mode
function curlPost(url, body, timeoutSec = 60) {
  const tmpFile = `/tmp/fal-v3-${Date.now()}-${Math.random().toString(36).slice(2)}.json`;
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
  console.log('\n=== V3 Prompt Strategy (10 creatures + 2 ruins) ===\n');
  console.log('Changes: LoRA 0.65, anti-drip negatives, varied compositions, new creatures');
  console.log(`Cost: ~$${(CARDS.length * 0.025).toFixed(2)}\n`);

  const results = [];

  for (let i = 0; i < CARDS.length; i++) {
    const card = CARDS[i];
    const prompt = `${card.scene}, ${STYLE}`;

    const typeSlug = card.type === 'PLANAR_RUIN' ? 'ruin' : card.faction.toLowerCase().replace(/_/g, '-');
    const fileName = `V3-${typeSlug}-${String(i + 1).padStart(2, '0')}.png`;
    console.log(`[${i + 1}/${CARDS.length}] ${card.name} (${card.faction}) [${card.comp}]`);
    console.log(`    Prompt words: ~${prompt.split(/\s+/).length}`);

    if (existsSync(join(OUT_DIR, fileName))) {
      console.log('    Already exists, skipping');
      results.push({ index: i + 1, fileName, name: card.name, faction: card.faction, comp: card.comp, type: card.type || 'CREATURE', skipped: true });
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
        console.log('    NSFW flagged, retrying with softer prompt...');
        // Retry with simplified prompt
        const retryResult = await callFal({
          prompt: `${card.name}, fantasy creature, ${STYLE}`,
          negative_prompt: NEG,
          image_size: 'portrait_4_3',
          num_inference_steps: 25,
          guidance_scale: 7.5,
          num_images: 1,
          enable_safety_checker: true,
          format: 'png',
          loras: [{ path: LORA_URL, scale: LORA_SCALE }],
        });
        if (retryResult.has_nsfw_concepts?.[0] || !retryResult.images?.[0]?.url) {
          console.log('    Still flagged, skipping');
          results.push({ index: i + 1, name: card.name, faction: card.faction, comp: card.comp, type: card.type || 'CREATURE', error: 'NSFW' });
          continue;
        }
        const img = await fetch(retryResult.images[0].url);
        const buf = Buffer.from(await img.arrayBuffer());
        writeFileSync(join(OUT_DIR, fileName), buf);
        console.log(`    Saved (retry): ${fileName} (${(buf.length / 1024).toFixed(0)}KB)`);
        results.push({ index: i + 1, fileName, name: card.name, faction: card.faction, comp: card.comp, type: card.type || 'CREATURE', seed: retryResult.seed, sizeKB: Math.round(buf.length / 1024), retry: true });
        continue;
      }

      if (!result.images?.[0]?.url) {
        console.log('    No image URL');
        results.push({ index: i + 1, name: card.name, faction: card.faction, comp: card.comp, type: card.type || 'CREATURE', error: 'No image' });
        continue;
      }

      const img = await fetch(result.images[0].url);
      const buf = Buffer.from(await img.arrayBuffer());
      writeFileSync(join(OUT_DIR, fileName), buf);
      console.log(`    Saved: ${fileName} (${(buf.length / 1024).toFixed(0)}KB, seed: ${result.seed})`);

      results.push({
        index: i + 1, fileName, name: card.name, faction: card.faction, comp: card.comp,
        type: card.type || 'CREATURE',
        seed: result.seed, sizeKB: Math.round(buf.length / 1024),
        promptWords: prompt.split(/\s+/).length,
      });
    } catch (err) {
      console.error(`    FAILED: ${err.message}`);
      results.push({ index: i + 1, name: card.name, faction: card.faction, comp: card.comp, type: card.type || 'CREATURE', error: err.message });
    }
  }

  writeFileSync(join(OUT_DIR, 'manifest.json'), JSON.stringify(results, null, 2));

  const ok = results.filter(r => !r.error && !r.skipped).length;
  console.log(`\n=== Complete: ${ok}/${CARDS.length} cards ===`);
  console.log(`Images: ${OUT_DIR}/`);
  console.log(`Est. cost: ~$${(ok * 0.025).toFixed(2)}`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });

#!/usr/bin/env node
// generate-v4-test.mjs — V4 batch
// Same recipe as v3 (LoRA 0.65, anti-drip negatives, defined brushwork)
// Learnings applied:
//   - Avoid creature descriptions that collapse into normal animals
//   - Push anatomy to be clearly fantastical/non-natural
//   - ENV and NAR compositions have highest keeper rate
//   - Celestial + Endless + Ironwright (industrial) have best hit rates
//   - All new creature types, no repeats

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, 'preview', 'pool-v4');
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

const LORA_URL = 'https://huggingface.co/EldritchAdam/SDXL_Eldritch_LoRAs/resolve/main/EldritchPaletteKnife.safetensors';
const LORA_SCALE = 0.65;
const STYLE = 'oil painting, dark fantasy, palette knife impasto, defined brushwork, chiaroscuro';
const NEG = 'digital art, 3d render, photorealistic, smooth gradients, airbrushed, ' +
  'anime, cartoon, watermark, text, borders, frames, ' +
  'symmetrical centered portrait, T-pose, white background, ' +
  'dripping paint, melting, paint streaks, vertical streaks, runny paint, ' +
  'nudity, nsfw';

const CARDS = [
  // IRONWRIGHT — brutalist space-industrial
  {
    name: 'Void Dredger',
    scene: 'A colossal excavation machine floating in the void of space, drill-arms extending downward into an asteroid, molten debris spraying upward, orbital scaffolding around it, distant stars',
    faction: 'IRONWRIGHT',
    comp: 'ENV',
  },
  {
    name: 'Piston Colossus',
    scene: 'A towering humanoid siege engine of riveted iron plates standing in a burning city, hydraulic legs knee-deep in rubble, smokestacks on its back belching black smoke, soldiers fleeing below',
    faction: 'IRONWRIGHT',
    comp: 'ENV',
  },
  // FEY COURTS — dark nature
  {
    name: 'Briarstalker',
    scene: 'A tall thin creature woven entirely from living thorny vines stalking through dense fog, no face just a tangle of barbed green tendrils, long vine-arms dragging on the ground, glowing sap dripping from thorns',
    faction: 'FEY_COURTS',
    comp: 'NAR',
  },
  {
    name: 'Lantern Moth',
    scene: 'A giant moth with wings of stained glass perched on a gnarled tree branch at twilight, each wing panel glowing a different color from within, antennae curling like fern fronds, fireflies surrounding it',
    faction: 'FEY_COURTS',
    comp: 'OBJ',
  },
  // DEMONIC — hellfire and corruption
  {
    name: 'Pit Herald',
    scene: 'An enormous four-armed demon emerging from a volcanic fissure waist-deep in lava, two arms bracing against the rock edges, two arms raised holding a burning banner, crown of twisted horns, magma dripping from its chest',
    faction: 'DEMONIC',
    comp: 'HERO',
  },
  {
    name: 'Bile Crawler',
    scene: 'A grotesque centipede-like demon with a human-skulled head slithering across the ceiling of a bone cathedral, dozens of clawed legs gripping the arches, acidic drool burning holes in the floor below, viewed from below',
    faction: 'DEMONIC',
    comp: 'ENV',
  },
  // CELESTIAL CRUSADE — divine radiance
  {
    name: 'Judgment Bell',
    scene: 'A massive golden bell suspended in a cathedral void by chains of light, divine runes orbiting it, shockwave rings visible in the air from its last toll, marble pillars cracking from the resonance',
    faction: 'CELESTIAL_CRUSADE',
    comp: 'OBJ',
  },
  {
    name: 'Aureate Warden',
    scene: 'A towering four-winged angel in white marble armor standing guard before an enormous sealed gate of gold, flaming sword planted point-down, halo of concentric golden rings rotating behind its head',
    faction: 'CELESTIAL_CRUSADE',
    comp: 'HERO',
  },
  // THE ENDLESS — undead, spectral
  {
    name: 'Bone Colossus',
    scene: 'A giant skeleton assembled from hundreds of different creatures fused together walking through a dead forest, mismatched skulls for kneecaps and shoulders, green necromantic fire in its ribcage, trees snapping underfoot',
    faction: 'THE_ENDLESS',
    comp: 'ENV',
  },
  {
    name: 'Wail Mother',
    scene: 'A translucent ghostly figure of a weeping woman hovering above a frozen lake, her spectral robes spreading across the water surface like mist, dozens of small ghost-children clinging to her skirts, moonlit, haunting',
    faction: 'THE_ENDLESS',
    comp: 'NAR',
  },

  // === PLANAR RUINS ===
  {
    name: 'The Resonance Arch',
    scene: 'A massive stone archway standing alone in a desert of black sand, the space inside the arch shimmering with a different reality visible through it, alien sky with two moons, ancient carved symbols along the arch, no people',
    faction: 'NEUTRAL',
    comp: 'OBJ',
    type: 'PLANAR_RUIN',
  },
  {
    name: 'Sunken Reliquary',
    scene: 'An ancient temple half-submerged in glowing turquoise water inside a vast underground cavern, crystal stalactites above reflecting light, stone columns covered in luminous algae, treasure visible beneath the water surface',
    faction: 'NEUTRAL',
    comp: 'ENV',
    type: 'PLANAR_RUIN',
  },
];

function curlPost(url, body, timeoutSec = 60) {
  const tmpFile = `/tmp/fal-v4-${Date.now()}-${Math.random().toString(36).slice(2)}.json`;
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
  while (true) {
    let status;
    try { status = curlGet(pollUrl, 20); } catch { execFileSync('sleep', ['3']); continue; }
    if (status.status === 'COMPLETED') break;
    if (status.status === 'FAILED') throw new Error(`Failed: ${JSON.stringify(status)}`);
    execFileSync('sleep', ['2']);
  }
  const resultUrl = `https://queue.fal.run/${endpoint}/requests/${requestId}`;
  const result = curlGet(resultUrl, 60);
  if (result.detail) throw new Error(`fal.ai fetch: ${JSON.stringify(result.detail)}`);
  return result;
}

async function main() {
  console.log('\n=== V4 Batch (10 creatures + 2 ruins) ===\n');
  console.log(`Cost: ~$${(CARDS.length * 0.025).toFixed(2)}\n`);

  const results = [];
  for (let i = 0; i < CARDS.length; i++) {
    const card = CARDS[i];
    const prompt = `${card.scene}, ${STYLE}`;
    const typeSlug = card.type === 'PLANAR_RUIN' ? 'ruin' : card.faction.toLowerCase().replace(/_/g, '-');
    const fileName = `V4-${typeSlug}-${String(i + 1).padStart(2, '0')}.png`;
    console.log(`[${i + 1}/${CARDS.length}] ${card.name} (${card.faction}) [${card.comp}]`);

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
        console.log('    NSFW flagged, retrying...');
        const retryResult = await callFal({
          prompt: `${card.name}, fantasy creature, ${STYLE}`,
          negative_prompt: NEG, image_size: 'portrait_4_3', num_inference_steps: 25,
          guidance_scale: 7.5, num_images: 1, enable_safety_checker: true, format: 'png',
          loras: [{ path: LORA_URL, scale: LORA_SCALE }],
        });
        if (retryResult.has_nsfw_concepts?.[0] || !retryResult.images?.[0]?.url) {
          results.push({ index: i + 1, name: card.name, faction: card.faction, error: 'NSFW' });
          continue;
        }
        const img = await fetch(retryResult.images[0].url);
        const buf = Buffer.from(await img.arrayBuffer());
        writeFileSync(join(OUT_DIR, fileName), buf);
        console.log(`    Saved (retry): ${fileName} (${(buf.length / 1024).toFixed(0)}KB)`);
        results.push({ index: i + 1, fileName, name: card.name, faction: card.faction, comp: card.comp, type: card.type || 'CREATURE', seed: retryResult.seed, sizeKB: Math.round(buf.length / 1024) });
        continue;
      }

      if (!result.images?.[0]?.url) {
        results.push({ index: i + 1, name: card.name, faction: card.faction, error: 'No image' });
        continue;
      }

      const img = await fetch(result.images[0].url);
      const buf = Buffer.from(await img.arrayBuffer());
      writeFileSync(join(OUT_DIR, fileName), buf);
      console.log(`    Saved: ${fileName} (${(buf.length / 1024).toFixed(0)}KB, seed: ${result.seed})`);
      results.push({ index: i + 1, fileName, name: card.name, faction: card.faction, comp: card.comp, type: card.type || 'CREATURE', seed: result.seed, sizeKB: Math.round(buf.length / 1024) });
    } catch (err) {
      console.error(`    FAILED: ${err.message}`);
      results.push({ index: i + 1, name: card.name, faction: card.faction, error: err.message });
    }
  }

  writeFileSync(join(OUT_DIR, 'manifest.json'), JSON.stringify(results, null, 2));
  const ok = results.filter(r => !r.error && !r.skipped).length;
  console.log(`\n=== Complete: ${ok}/${CARDS.length} ===`);
  console.log(`Est. cost: ~$${(ok * 0.025).toFixed(2)}`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });

#!/usr/bin/env node
// generate-v18-sdxl-full-test.mjs — SDXL + CHSCRT LoRA @ scale 1.0
// 2 per faction + 2 ruins = 12 images

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, 'preview', 'pool-v18');
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

const CHSCRT_LORA = 'https://pub-ab96c6d0742748d19e4ad5502f3fea09.r2.dev/training/chscrt-sdxl-lora.safetensors';
const SCALE = 1.0;
const STYLE = 'oil painting, dark fantasy, palette knife impasto, defined brushwork, chiaroscuro';
const NEG = 'digital art, 3d render, photorealistic, smooth gradients, airbrushed, ' +
  'anime, cartoon, watermark, text, borders, frames, ' +
  'symmetrical centered portrait, T-pose, white background, ' +
  'dripping paint, melting, paint streaks, vertical streaks, runny paint, ' +
  'standing still, posing, facing camera, ' +
  'nudity, nsfw';

const CREATURES = [
  // IRONWRIGHT — brutalist space-industrial
  {
    name: 'Rebar Golem',
    prompt: `a painting in the style of CHSCRT, ${STYLE}, a towering humanoid construct of twisted rebar and poured concrete striding through a ruined orbital shipyard, exposed hydraulic pistons in its joints leaking dark fluid, reactor-blue light glowing from its chest cavity, debris and sparks cascading from each footfall, vast industrial scaffolding behind`,
    faction: 'IRONWRIGHT',
    comp: 'ACT',
  },
  {
    name: 'Void Welder',
    prompt: `a painting in the style of CHSCRT, ${STYLE}, portrait of a massive armored figure in a welding mask standing before the open hull of a starship, arc-welder torch blazing white-blue in one gauntleted hand, molten metal droplets frozen in air, the black void of space visible through the hull breach behind, cold industrial lighting`,
    faction: 'IRONWRIGHT',
    comp: 'PORTRAIT',
  },
  // FEY COURTS
  {
    name: 'Thornback Stag',
    prompt: `a painting in the style of CHSCRT, ${STYLE}, an enormous stag with antlers made of living blackthorn branches covered in white blossoms, each step leaving patches of wildflowers in scorched earth, standing at the edge of a misty ancient forest clearing, shafts of golden light through the canopy, smaller fey creatures watching from the undergrowth`,
    faction: 'FEY_COURTS',
    comp: 'ENV',
  },
  {
    name: 'Briar Witch',
    prompt: `a painting in the style of CHSCRT, ${STYLE}, close-up of a fey woman with bark-textured skin and eyes like amber sap, crown of living roses with thorns piercing her brow drawing golden ichor, hair made of cascading ivy and ferns, a massive gnarled oak tree visible behind her wreathed in foxfire, twilight atmosphere`,
    faction: 'FEY_COURTS',
    comp: 'PORTRAIT',
  },
  // DEMONIC KINGDOMS
  {
    name: 'Infernal Bailiff',
    prompt: `a painting in the style of CHSCRT, ${STYLE}, a towering demon in obsidian plate armor standing in a hellish courtroom, holding an enormous iron gavel dripping with brimstone, scroll of damned souls unfurling from its other hand, lesser demons cowering in chains behind a dock of black iron, sulfurous yellow light from cracks in the floor`,
    faction: 'DEMONIC',
    comp: 'NAR',
  },
  {
    name: 'Ember Hound',
    prompt: `a painting in the style of CHSCRT, ${STYLE}, a pack of three skeletal dogs made of cooling lava and obsidian, mid-sprint across a volcanic wasteland, magma drool trailing from their jaws, paw prints leaving small fires behind them, a burning city silhouetted on the horizon, ash falling like snow`,
    faction: 'DEMONIC',
    comp: 'ACT',
  },
  // CELESTIAL CRUSADE
  {
    name: 'Siege Seraph',
    prompt: `a painting in the style of CHSCRT, ${STYLE}, a six-winged angel in golden plate armor descending from storm clouds onto a battlefield, wielding a flaming greatsword longer than its body, each wing feather is a blade of light, divine radiance burning the darkness below, armies clashing in the far distance, epic scale`,
    faction: 'CELESTIAL_CRUSADE',
    comp: 'ACT',
  },
  {
    name: 'Chapel Warden',
    prompt: `a painting in the style of CHSCRT, ${STYLE}, portrait of a stern celestial knight with a halo of rotating golden rings behind their helmeted head, eyes glowing soft white through visor slits, ornate ivory and gold armor engraved with scripture, holding a tower shield bearing a radiant sun emblem, cathedral interior with stained glass behind`,
    faction: 'CELESTIAL_CRUSADE',
    comp: 'PORTRAIT',
  },
  // THE ENDLESS
  {
    name: 'Bone Colossus',
    prompt: `a painting in the style of CHSCRT, ${STYLE}, a massive skeletal giant assembled from thousands of human bones rising from a battlefield graveyard, its ribcage serving as a cage holding a swirling green necromantic energy, smaller undead clinging to its legs and arms, moonlit night with ghostly mist rolling across tombstones`,
    faction: 'THE_ENDLESS',
    comp: 'ENV',
  },
  {
    name: 'Wailing Shade',
    prompt: `a painting in the style of CHSCRT, ${STYLE}, a translucent spectral figure hovering above a frozen lake at night, its form trailing into wisps of ghostly blue-green energy, face contorted in a silent scream, the ice below cracked in a web pattern from its presence, dead trees on the shore, northern lights in the sky reflecting in the ice`,
    faction: 'THE_ENDLESS',
    comp: 'ENV',
  },
  // PLANAR RUINS — neutral
  {
    name: 'The Resonance Spire',
    prompt: `a painting in the style of CHSCRT, ${STYLE}, an ancient crystalline tower rising from cracked alien ground, the tower is partially ruined but still hums with pale otherworldly light, geometric patterns carved into its surface glow faintly, strange plants growing at its base unlike anything from any known world, two moons visible in a twilight sky, sense of ancient abandoned purpose`,
    faction: 'NEUTRAL',
    comp: 'OBJ',
  },
  {
    name: 'The Sunken Archive',
    prompt: `a painting in the style of CHSCRT, ${STYLE}, the entrance to a half-submerged ancient library built into a cliff face, water lapping at stone steps carved with unknown script, massive stone doors partially open revealing shelves of crystalline tablets glowing from within, bioluminescent algae on the walls, a sense of vast knowledge preserved in silence, dramatic clouds overhead`,
    faction: 'NEUTRAL',
    comp: 'ENV',
  },
];

function curlPost(url, body, timeoutSec = 120) {
  const tmpFile = `/tmp/fal-v18-${Date.now()}-${Math.random().toString(36).slice(2)}.json`;
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
  console.log(`\n=== V18 SDXL Full Test — scale ${SCALE} (${CREATURES.length} images) ===\n`);
  console.log(`Cost: ~$${(CREATURES.length * 0.025).toFixed(2)}\n`);

  const results = [];
  for (let i = 0; i < CREATURES.length; i++) {
    const creature = CREATURES[i];
    const typeSlug = creature.faction.toLowerCase().replace(/_/g, '-');
    const nameSlug = creature.name.toLowerCase().replace(/\s+/g, '-');
    const fileName = `V18-${typeSlug}-${nameSlug}.png`;
    console.log(`[${i + 1}/${CREATURES.length}] ${creature.name} (${creature.faction})`);

    if (existsSync(join(OUT_DIR, fileName))) {
      console.log('    Already exists, skipping');
      results.push({ index: i + 1, fileName, name: creature.name, faction: creature.faction, comp: creature.comp, scale: SCALE, skipped: true });
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
        loras: [{ path: CHSCRT_LORA, scale: SCALE }],
      });

      if (result.has_nsfw_concepts?.[0] || !result.images?.[0]?.url) {
        console.log('    NSFW or no image — retrying with safety checker off');
        const retry = await callFal({
          prompt: creature.prompt,
          negative_prompt: NEG,
          image_size: 'portrait_4_3',
          num_inference_steps: 30,
          guidance_scale: 7.5,
          num_images: 1,
          enable_safety_checker: false,
          output_format: 'png',
          loras: [{ path: CHSCRT_LORA, scale: SCALE }],
        });
        if (!retry.images?.[0]?.url) {
          console.log('    Still no image');
          results.push({ index: i + 1, name: creature.name, faction: creature.faction, comp: creature.comp, scale: SCALE, error: 'No image' });
          continue;
        }
        const img = await fetch(retry.images[0].url);
        const buf = Buffer.from(await img.arrayBuffer());
        writeFileSync(join(OUT_DIR, fileName), buf);
        console.log(`    Saved (retry): ${fileName} (${(buf.length / 1024).toFixed(0)}KB, seed: ${retry.seed})`);
        results.push({ index: i + 1, fileName, name: creature.name, faction: creature.faction, comp: creature.comp, scale: SCALE, seed: retry.seed, sizeKB: Math.round(buf.length / 1024) });
        continue;
      }

      const img = await fetch(result.images[0].url);
      const buf = Buffer.from(await img.arrayBuffer());
      writeFileSync(join(OUT_DIR, fileName), buf);
      console.log(`    Saved: ${fileName} (${(buf.length / 1024).toFixed(0)}KB, seed: ${result.seed})`);
      results.push({ index: i + 1, fileName, name: creature.name, faction: creature.faction, comp: creature.comp, scale: SCALE, seed: result.seed, sizeKB: Math.round(buf.length / 1024) });
    } catch (err) {
      console.error(`    FAILED: ${err.message}`);
      results.push({ index: i + 1, name: creature.name, faction: creature.faction, comp: creature.comp, scale: SCALE, error: err.message });
    }
  }

  writeFileSync(join(OUT_DIR, 'manifest.json'), JSON.stringify(results, null, 2));
  const ok = results.filter(r => !r.error && !r.skipped).length;
  console.log(`\n=== Complete: ${ok}/${CREATURES.length} ===`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });

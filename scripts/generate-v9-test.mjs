#!/usr/bin/env node
// generate-v9-test.mjs — Whimsical fey + angelic celestials + strong comp repeats
// Fey: fairy-tale sprites, luminous creatures, playful/magical tone
// Celestial: seraphim, multi-winged, biblically-accurate, radiant beings
// Plus: 2 more silhouettes, 1 more unusual (compositions that work well)

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, 'preview', 'pool-v9');
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
  // === WHIMSICAL FEY (5 cards) — fairy-tale, luminous, magical, playful ===
  {
    name: 'Dewdrop Sprite',
    scene: 'A tiny luminous fairy with dragonfly wings perched on an enormous mushroom cap, body glowing soft blue-white, trailing sparkling dust, surrounded by oversized flowers and ferns in a moonlit glade, magical and delicate',
    faction: 'FEY_COURTS',
    comp: 'OBJ',
  },
  {
    name: 'Puck the Trickster',
    scene: 'A grinning fox-faced fey creature mid-leap between giant lily pads on a glowing pond, juggling three orbs of different colored light, long ears trailing behind, mischievous expression, fireflies swirling around in chaotic patterns',
    faction: 'FEY_COURTS',
    comp: 'ACT',
  },
  {
    name: 'Blossom Golem',
    scene: 'A gentle giant made entirely of living flowers and vines, body of intertwined roses and wisteria, face formed from sunflower and peony petals, butterflies resting on its shoulders, standing in a wildflower meadow at golden hour',
    faction: 'FEY_COURTS',
    comp: 'HERO',
  },
  {
    name: 'Moonwell Guardian',
    scene: 'An ethereal stag with antlers of crystallized moonlight standing in a pool of silver water, its reflection showing a different creature entirely, luminous moths circling its crown, ancient willows draped overhead, dreamlike and serene',
    faction: 'FEY_COURTS',
    comp: 'NAR',
  },
  {
    name: 'The Laughing Swarm',
    scene: 'A cloud of dozens of tiny mushroom-headed sprites tumbling and somersaulting through autumn air, each one different colors and expressions, leaves swirling with them, warm orange-gold sunset light, joyful chaotic energy',
    faction: 'FEY_COURTS',
    comp: 'GROUP',
  },

  // === ANGELIC CELESTIALS (5 cards) — seraphim, radiant, biblically-accurate, divine ===
  {
    name: 'Seraph of the First Light',
    scene: 'A six-winged seraph hovering in a column of golden light, two wings covering its face, two covering its feet, two spread wide, body of pure radiance barely visible, concentric rings of holy fire behind it, terrible and beautiful',
    faction: 'CELESTIAL_CRUSADE',
    comp: 'HERO',
  },
  {
    name: 'The Watcher',
    scene: 'A biblically-accurate angel as a wheel of interlocking golden rings covered in hundreds of open eyes, each eye a different color, floating above a desert, wings of light extending in impossible directions, mortals prostrate below',
    faction: 'CELESTIAL_CRUSADE',
    comp: 'UNUSUAL',
  },
  {
    name: 'Choir Eternal',
    scene: 'Three angels of ascending size singing in formation, the smallest with two wings and a harp, the middle with four wings and a horn, the largest with six wings and a voice visible as golden shockwaves, cathedral interior, stained glass light',
    faction: 'CELESTIAL_CRUSADE',
    comp: 'GROUP',
  },
  {
    name: 'Herald of Dawn',
    scene: 'Close-up portrait of an angelic face with four eyes arranged vertically, skin of polished gold, a crown of seven small suns orbiting its head, expression of serene judgment, wings visible at the edges of frame, blinding backlight',
    faction: 'CELESTIAL_CRUSADE',
    comp: 'PORTRAIT',
  },
  {
    name: 'The Descending',
    scene: 'Silhouette of a massive multi-winged angel descending from a hole torn in storm clouds, divine light pouring down around it like a spotlight, tiny city below in shadow, rain turning to gold where the light touches it',
    faction: 'CELESTIAL_CRUSADE',
    comp: 'SILHOUETTE',
  },

  // === BONUS: repeat compositions that worked well in v8 ===
  {
    name: 'Plague Doctor',
    scene: 'Silhouette of a hunched figure with a long beaked mask and billowing coat walking through a foggy graveyard, backlit by a sickly green moon, rats streaming around its feet as shadow shapes, plague lantern swinging',
    faction: 'THE_ENDLESS',
    comp: 'SILHOUETTE',
  },
  {
    name: 'Trench Crawler',
    scene: 'Deep underwater mechanical submersible creature with riveted hull plating and searchlight eyes prowling along an ocean trench floor, anglerfish lure on its head, barnacles encrusting its joints, abyssal darkness',
    faction: 'IRONWRIGHT',
    comp: 'UNUSUAL',
  },
  {
    name: 'Hellmouth Gate',
    scene: 'A massive demonic face carved into a cliff wall serving as a gate, mouth open as the entrance, flames licking from nostrils, horns forming the archway, pilgrims in dark robes approaching in a procession, volcanic landscape',
    faction: 'DEMONIC',
    comp: 'ENV',
    type: 'PLANAR_RUIN',
  },
];

function curlPost(url, body, timeoutSec = 60) {
  const tmpFile = `/tmp/fal-v9-${Date.now()}-${Math.random().toString(36).slice(2)}.json`;
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
  console.log('\n=== V9 Whimsical Fey + Angelic Celestials (13 cards) ===\n');
  console.log('Fey: 5 whimsical/fairy-tale | Celestial: 5 angelic/seraphim | Bonus: 3 strong comps');
  console.log(`Cost: ~$${(CARDS.length * 0.025).toFixed(2)}\n`);

  const results = [];
  for (let i = 0; i < CARDS.length; i++) {
    const card = CARDS[i];
    const prompt = `${card.scene}, ${STYLE}`;
    const typeSlug = card.type === 'PLANAR_RUIN' ? 'ruin' : card.faction.toLowerCase().replace(/_/g, '-');
    const fileName = `V9-${typeSlug}-${String(i + 1).padStart(2, '0')}.png`;
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
          prompt: `${card.name}, dark fantasy creature, ${STYLE}`,
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

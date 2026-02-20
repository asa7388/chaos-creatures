#!/usr/bin/env node
// generate-v12-test.mjs — Mythological creatures IN ACTION
// Every creature has a specific verb/action — no standing, no posing
// The action naturally produces varied orientations and compositions

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, 'preview', 'pool-v12');
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
  'nudity, nsfw, standing still, posing, facing camera';

const CARDS = [
  // === FEY COURTS — creatures caught mid-action ===
  {
    name: 'Kelpie Dragging',
    scene: 'A kelpie water-horse dragging a rider beneath the surface of a dark Scottish loch, the horse diving downward into black water, only its hindquarters and the victims flailing hand still above the surface, reeds bending, ripples spreading',
    faction: 'FEY_COURTS',
    comp: 'ACT',
  },
  {
    name: 'Dryad Emerging',
    scene: 'A Greek dryad mid-emergence from an ancient oak tree, her body half-bark half-flesh, one arm reaching outward while the other is still fused to the trunk, leaves cascading from her hair, twilight forest, caught mid-transformation',
    faction: 'FEY_COURTS',
    comp: 'ACT',
  },
  {
    name: 'Pixie Theft',
    scene: 'A tiny glowing pixie snatching a golden coin from a sleeping giants open palm, wings blurred with speed, the giant filling most of the frame with the pixie a bright speck against dark fingers, extreme scale contrast',
    faction: 'FEY_COURTS',
    comp: 'CLOSE',
  },
  {
    name: 'Wild Hunt Rider',
    scene: 'A spectral huntsman on a skeletal horse leaping over a stone wall, hounds of green fire streaming alongside, cloak billowing behind, seen from the side mid-jump, moonlit countryside below, terrified villagers glimpsed through windows',
    faction: 'FEY_COURTS',
    comp: 'ACT',
  },

  // === CELESTIAL CRUSADE — divine beings in moments of power ===
  {
    name: 'Seraph Smiting',
    scene: 'A six-winged seraph plunging downward from heaven with a sword of fire, robes streaming upward from the descent, face hidden behind crossed wings, the ground below cracking and glowing from the approaching impact',
    faction: 'CELESTIAL_CRUSADE',
    comp: 'ACT',
  },
  {
    name: 'Griffin Diving',
    scene: 'A griffin folding its wings into a hunting dive toward a serpent on the ground far below, talons extended, beak open, seen from behind and above as it plummets through clouds, the landscape a distant patchwork below',
    faction: 'CELESTIAL_CRUSADE',
    comp: 'AERIAL',
  },
  {
    name: 'Pegasus Fleeing',
    scene: 'A wounded pegasus galloping across a burning sky, one wing torn and trailing golden blood, the other beating desperately, fleeing a storm of black arrows, seen from the side in full gallop, clouds on fire behind',
    faction: 'CELESTIAL_CRUSADE',
    comp: 'ACT',
  },
  {
    name: 'Nephilim Rising',
    scene: 'A biblical Nephilim giant pushing itself up from kneeling in a crater, one enormous hand pressing into the earth, head bowed, cracks of divine light splitting its stone-like skin, armies of tiny soldiers scrambling away',
    faction: 'CELESTIAL_CRUSADE',
    comp: 'ENV',
  },

  // === THE ENDLESS — undead caught in terrible moments ===
  {
    name: 'Wraith Reaching',
    scene: 'A wraith stretching one impossibly long arm through a doorway toward a candle flame, its body dissolving into smoke at the edges, the rest of it still coiled in the dark hallway beyond, only the clawed hand in sharp focus',
    faction: 'THE_ENDLESS',
    comp: 'CLOSE',
  },
  {
    name: 'Lich Casting',
    scene: 'A lich hunched over a massive tome floating in mid-air, skeletal hands weaving green necromantic energy that spirals upward and outward, corpses on the floor beginning to twitch and rise, seen from a low angle behind the lich',
    faction: 'THE_ENDLESS',
    comp: 'NAR',
  },
  {
    name: 'Vampire Feeding',
    scene: 'A Nosferatu-like vampire crouched over a fallen knight, mouth at the neck, one clawed hand pinning the armor, caught mid-feed, rats gathering in the shadows of a ruined cathedral, moonlight through a broken rose window above',
    faction: 'THE_ENDLESS',
    comp: 'NAR',
  },
  {
    name: 'Death Ship',
    scene: 'A Viking longship crewed by draugr undead rowing through a frozen sea, the ship cutting through ice floes, tattered sails bearing rune symbols, a spectral green light emanating from below the waterline, seen from the side',
    faction: 'THE_ENDLESS',
    comp: 'ENV',
  },

  // === DEMONIC — monsters in violent motion ===
  {
    name: 'Minotaur Charging',
    scene: 'A minotaur charging headlong down a torch-lit labyrinth corridor, head lowered with horns aimed forward, hooves sparking on stone, walls blurring with speed, a dropped shield and scattered bones in its path, seen from ahead',
    faction: 'DEMONIC',
    comp: 'ACT',
  },
  {
    name: 'Hydra Regrowing',
    scene: 'A Greek hydra with two neck stumps sprouting new heads, the fresh heads emerging wet and snarling from the wounds, the remaining three heads snapping in different directions, hero with torch visible at bottom edge, swamp setting',
    faction: 'DEMONIC',
    comp: 'CLOSE',
  },
  {
    name: 'Rakshasa Shapeshifting',
    scene: 'A Hindu rakshasa caught mid-transformation between tiger and human form, one arm still a striped paw with claws extended, face half-human half-feline, ornate jewelry warping around changing flesh, palace interior with silk curtains',
    faction: 'DEMONIC',
    comp: 'PORTRAIT',
  },
  {
    name: 'Kraken Crushing',
    scene: 'A kraken wrapping its tentacles around a galleon, the ship tilting and cracking, sailors falling into churning seas, one massive eye visible just below the waterline, tentacles erupting from waves on all sides, storm raging',
    faction: 'DEMONIC',
    comp: 'ENV',
  },

  // === IRONWRIGHT — machines in operation ===
  {
    name: 'Golem Awakening',
    scene: 'A clay golem cracking open its own chest to reveal glowing Hebrew letters inside, pieces of dried clay falling away, one foot stepping forward off a stone pedestal for the first time, dust cloud rising, medieval workshop shelves behind',
    faction: 'IRONWRIGHT',
    comp: 'ACT',
  },
  {
    name: 'Siege Tower Walking',
    scene: 'A colossal walking siege tower striding through a battlefield, each leg-step crushing fortifications below, archers firing from its platforms, battering ram swinging from its front, smoke and fire everywhere, seen from ground level',
    faction: 'IRONWRIGHT',
    comp: 'ENV',
  },

  // === RUINS — places in moments of transformation ===
  {
    name: 'Pompeii Frozen',
    scene: 'A Roman temple interior frozen in the moment of volcanic destruction, ash pouring through the ceiling, a statue toppling, mosaics cracking, a single oil lamp still burning on an altar, everything covered in grey pumice dust',
    faction: 'NEUTRAL',
    comp: 'NAR',
    type: 'PLANAR_RUIN',
  },
  {
    name: 'Stone Circle Activating',
    scene: 'A Stonehenge-like stone circle at the moment of activation, each megalith glowing with different colored runes, lightning arcing between the stones, the ground inside the circle lifting and cracking, seen from outside the ring',
    faction: 'NEUTRAL',
    comp: 'ENV',
    type: 'PLANAR_RUIN',
  },
];

function curlPost(url, body, timeoutSec = 60) {
  const tmpFile = `/tmp/fal-v12-${Date.now()}-${Math.random().toString(36).slice(2)}.json`;
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
  console.log('\n=== V12 Mythological Creatures IN ACTION (20 cards) ===\n');
  console.log('Every creature has a specific verb — no standing, no posing');
  console.log(`Cost: ~$${(CARDS.length * 0.025).toFixed(2)}\n`);

  const results = [];
  for (let i = 0; i < CARDS.length; i++) {
    const card = CARDS[i];
    const prompt = `${card.scene}, ${STYLE}`;
    const typeSlug = card.type === 'PLANAR_RUIN' ? 'ruin' : card.faction.toLowerCase().replace(/_/g, '-');
    const fileName = `V12-${typeSlug}-${String(i + 1).padStart(2, '0')}.png`;
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
          prompt: `${card.name}, dark fantasy creature in action, ${STYLE}`,
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

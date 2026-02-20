#!/usr/bin/env node
// generate-v10-test.mjs — Mythological references batch
// Uses public domain mythology to anchor prompts to specific visual archetypes
// SDXL has strong training data on classical mythology art

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, 'preview', 'pool-v10');
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
  // === FEY COURTS — Celtic/Norse/Greek mythology ===
  {
    name: 'The Green Man',
    scene: 'A face made entirely of oak leaves and ivy peering out from an ancient tree trunk, like the Green Man of medieval carvings but alive, eyes of glowing amber, acorns falling from his leafy beard, misty forest at twilight',
    faction: 'FEY_COURTS',
    comp: 'CLOSE',
  },
  {
    name: 'Cernunnos Reborn',
    scene: 'A towering antlered god sitting cross-legged in a sacred grove, like the Celtic Cernunnos, holding a serpent in one hand and a golden torc in the other, animals gathered at his feet, ancient standing stones behind, dappled sunlight',
    faction: 'FEY_COURTS',
    comp: 'NAR',
  },
  {
    name: 'Selkie Matriarch',
    scene: 'A woman mid-transformation between seal and human form emerging from crashing waves on moonlit rocks, seal skin half-draped over her shoulders like a cloak, wild ocean spray, lighthouse distant, melancholy and powerful',
    faction: 'FEY_COURTS',
    comp: 'ACT',
  },

  // === CELESTIAL CRUSADE — Biblical/Hindu/Egyptian mythology ===
  {
    name: 'The Burning Throne',
    scene: 'A massive throne of fire floating in clouds like Ezekiels vision of the Merkabah, four living creatures at each corner with faces of lion eagle ox and man, wheels within wheels covered in eyes spinning around it, terrible divine glory',
    faction: 'CELESTIAL_CRUSADE',
    comp: 'UNUSUAL',
  },
  {
    name: 'Deva of War',
    scene: 'A multi-armed celestial warrior like a Hindu deva, six arms each holding a different weapon of light, third eye open on forehead, floating above a battlefield on a lotus platform, radiating golden mandala behind, serene expression amid chaos',
    faction: 'CELESTIAL_CRUSADE',
    comp: 'HERO',
  },
  {
    name: 'Judgment of Ma\'at',
    scene: 'An Egyptian-inspired celestial figure with falcon wings holding golden scales, one pan containing a heart and the other a feather, hieroglyphic light symbols floating around, standing before massive golden doors, solemn and final',
    faction: 'CELESTIAL_CRUSADE',
    comp: 'NAR',
  },

  // === THE ENDLESS — Egyptian/Greek/Norse underworld mythology ===
  {
    name: 'The Ferryman',
    scene: 'Charon-like skeletal figure in tattered robes poling a long boat through an underground river of souls, ghostly faces visible in the dark water, lantern at the prow casting green light, cavern ceiling of stalactites, coins on the dead eyes of passengers',
    faction: 'THE_ENDLESS',
    comp: 'NAR',
  },
  {
    name: 'Hound of the Threshold',
    scene: 'A massive three-headed hound like Cerberus guarding a gate of bones, each head snarling in a different direction, chains of black iron around its necks, hellfire reflected in six eyes, skulls scattered at its feet, underground cavern entrance',
    faction: 'THE_ENDLESS',
    comp: 'HERO',
  },
  {
    name: 'The Jackal Priest',
    scene: 'An Anubis-like figure with jackal head and human body in ornate funerary robes performing a ritual over a mummy on a stone slab, canopic jars nearby, hieroglyphic walls, torchlight and incense smoke, solemn ceremony',
    faction: 'THE_ENDLESS',
    comp: 'NAR',
  },

  // === DEMONIC KINGDOMS — Dante/Greek/Mesopotamian mythology ===
  {
    name: 'Tiamat Ascendant',
    scene: 'A colossal five-headed dragon like the Mesopotamian Tiamat rising from a churning ocean of chaos, each head a different element of destruction, waves crashing against coastal cliffs, ships tossed like toys, storm clouds swirling around the heads',
    faction: 'DEMONIC',
    comp: 'ENV',
  },
  {
    name: 'The Chimera',
    scene: 'A beast with the body of a lion, a goat head growing from its spine, and a serpent for a tail, like the Greek Chimera, breathing fire from the lion mouth, prowling through volcanic ruins at night, lava rivers glowing in cracks',
    faction: 'DEMONIC',
    comp: 'ACT',
  },
  {
    name: 'Lord of Dis',
    scene: 'A gigantic horned figure frozen waist-deep in ice like Dante Lucifer in the ninth circle, three faces visible each chewing a sinner, bat wings creating frozen wind, damned souls trapped in the ice around it, blue-black hellscape',
    faction: 'DEMONIC',
    comp: 'ENV',
  },

  // === IRONWRIGHT — Greek/Classical mythology ===
  {
    name: 'The New Colossus',
    scene: 'A titanic iron automaton like the Colossus of Rhodes straddling a harbor entrance, ships passing between its legs, one hand holding a beacon of industrial flame, riveted panels instead of bronze skin, cranes building additions to its shoulders',
    faction: 'IRONWRIGHT',
    comp: 'ENV',
  },
  {
    name: 'Vulcans Apprentice',
    scene: 'A massive figure at an enormous forge like Hephaestus workshop, hammering a glowing weapon on an anvil the size of a house, sparks flying in all directions, mechanical bellows pumping, half-built automatons lining the walls',
    faction: 'IRONWRIGHT',
    comp: 'ACT',
  },

  // === RUINS — Ancient wonder references ===
  {
    name: 'Tower of Babel',
    scene: 'A crumbling spiral tower reaching into storm clouds, like Bruegels Tower of Babel but ruined and overgrown, each level built in a different architectural style, birds nesting in broken windows, vines covering lower levels, epic scale from below',
    faction: 'NEUTRAL',
    comp: 'ENV',
    type: 'PLANAR_RUIN',
  },
  {
    name: 'The Sunken Temple',
    scene: 'An Atlantis-like temple partially submerged in crystal clear water, Greek columns draped in kelp, fish swimming through broken pediments, sunlight filtering down through water creating god-rays on mosaic floors, coral growing on statues',
    faction: 'NEUTRAL',
    comp: 'UNUSUAL',
    type: 'PLANAR_RUIN',
  },
];

function curlPost(url, body, timeoutSec = 60) {
  const tmpFile = `/tmp/fal-v10-${Date.now()}-${Math.random().toString(36).slice(2)}.json`;
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
  console.log('\n=== V10 Mythological References (16 cards) ===\n');
  console.log('Fey: Celtic/Norse | Celestial: Biblical/Hindu/Egyptian | Endless: Underworld myths');
  console.log('Demonic: Dante/Greek/Mesopotamian | Ironwright: Classical | Ruins: Ancient wonders');
  console.log(`Cost: ~$${(CARDS.length * 0.025).toFixed(2)}\n`);

  const results = [];
  for (let i = 0; i < CARDS.length; i++) {
    const card = CARDS[i];
    const prompt = `${card.scene}, ${STYLE}`;
    const typeSlug = card.type === 'PLANAR_RUIN' ? 'ruin' : card.faction.toLowerCase().replace(/_/g, '-');
    const fileName = `V10-${typeSlug}-${String(i + 1).padStart(2, '0')}.png`;
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

#!/usr/bin/env node
// generate-v11-test.mjs — Public domain mythological creatures, heavy batch
// Every creature anchored to a well-known mythological archetype SDXL knows

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, 'preview', 'pool-v11');
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
  // === FEY COURTS — Celtic/European fairy mythology ===
  {
    name: 'The Kelpie',
    scene: 'A Scottish kelpie rising from a dark loch, a horse made of water and seaweed with glowing eyes, mane dripping with pondweed, moonlight reflecting off its liquid flanks, misty highland shoreline behind',
    faction: 'FEY_COURTS',
    comp: 'ACT',
  },
  {
    name: 'Satyr Piper',
    scene: 'A Greek satyr with goat legs and small horns sitting on a mossy boulder playing pan pipes, forest animals gathered listening in a ring, dappled golden light through ancient oaks, enchanted and dreamlike',
    faction: 'FEY_COURTS',
    comp: 'NAR',
  },
  {
    name: 'The Erlking',
    scene: 'The Germanic Erlking riding a pale horse through a dark forest at speed, crown of thorns and ice, face beautiful but terrible, reaching one hand toward the viewer, dead leaves swirling in his wake, children-shaped shadows fleeing',
    faction: 'FEY_COURTS',
    comp: 'ACT',
  },
  {
    name: 'The Dullahan',
    scene: 'An Irish Dullahan headless horseman on a black steed, carrying its own grinning head under one arm like a lantern, the head glowing with ghostly fire, riding across a misty moor at night, whip made of a human spine',
    faction: 'FEY_COURTS',
    comp: 'SILHOUETTE',
  },

  // === CELESTIAL CRUSADE — Divine/Holy mythology ===
  {
    name: 'Valkyrie Descending',
    scene: 'A Norse Valkyrie on a white winged horse diving from storm clouds toward a battlefield below, spear of light in hand, golden hair and armor streaming, aurora borealis behind, fallen warriors reaching up',
    faction: 'CELESTIAL_CRUSADE',
    comp: 'ACT',
  },
  {
    name: 'The Griffin',
    scene: 'A majestic griffin perched on a mountain peak, lion body and eagle head and wings, golden feathers transitioning to tawny fur, guarding a nest of glowing eggs, sunrise behind mountain range, regal and watchful',
    faction: 'CELESTIAL_CRUSADE',
    comp: 'HERO',
  },
  {
    name: 'Phoenix Reborn',
    scene: 'A phoenix mid-rebirth erupting from a pyre of its own ashes, wings of pure fire spread wide, feathers reforming from flame to gold, embers and sparks spiraling upward, ancient stone altar below, dramatic upward composition',
    faction: 'CELESTIAL_CRUSADE',
    comp: 'ACT',
  },
  {
    name: 'The Sphinx',
    scene: 'An Egyptian sphinx with a womans face and lions body reclining before a massive stone doorway covered in hieroglyphs, one paw resting on a cracked tablet, desert sand dunes behind, twilight, inscrutable expression',
    faction: 'CELESTIAL_CRUSADE',
    comp: 'NAR',
  },

  // === THE ENDLESS — Death/Underworld mythology ===
  {
    name: 'The Draugr',
    scene: 'A Norse draugr undead viking bursting from a burial mound, rusted chainmail and rotting furs, glowing blue eyes, gripping a corroded sword, burial treasures scattered, frozen tundra and northern lights above',
    faction: 'THE_ENDLESS',
    comp: 'HERO',
  },
  {
    name: 'The Ghoul',
    scene: 'An Arabian ghoul crouching over a grave in a desert cemetery, elongated limbs and grey skin, hyena-like face with too many teeth, digging with clawed hands, scattered bones, crescent moon and sand dunes',
    faction: 'THE_ENDLESS',
    comp: 'CLOSE',
  },
  {
    name: 'Nosferatu',
    scene: 'A Nosferatu-like vampire ascending a narrow stone staircase, impossibly long shadow cast on the wall behind, bald head, pointed ears, clawed fingers, rats at its feet, single candle guttering, expressionist angles',
    faction: 'THE_ENDLESS',
    comp: 'SILHOUETTE',
  },
  {
    name: 'The Morrigan',
    scene: 'The Celtic Morrigan as a woman in black armor with a cloak of raven feathers, a murder of crows swirling around her, standing on a battlefield of fallen warriors, red sky, one hand holding a severed head, terrible beauty',
    faction: 'THE_ENDLESS',
    comp: 'HERO',
  },

  // === DEMONIC KINGDOMS — Infernal/Monster mythology ===
  {
    name: 'The Minotaur',
    scene: 'A Greek Minotaur in a dark stone labyrinth, massive bull head on muscular human body, snorting steam, one hand dragging a battle axe along the floor leaving sparks, torchlight from around a corner, claustrophobic walls',
    faction: 'DEMONIC',
    comp: 'NAR',
  },
  {
    name: 'Ifrit Lord',
    scene: 'An Arabian Ifrit, a djinn of smokeless fire, towering with a body of living flame and obsidian skin, gold jewelry melted into its form, floating above a desert oasis that boils beneath it, sandstorm swirling',
    faction: 'DEMONIC',
    comp: 'ENV',
  },
  {
    name: 'The Manticore',
    scene: 'A Persian Manticore prowling through ancient ruins at night, lion body with a bearded human face and rows of shark teeth, scorpion tail arched over its back dripping venom, bat wings half-spread, hunting pose',
    faction: 'DEMONIC',
    comp: 'ACT',
  },
  {
    name: 'Oni Warlord',
    scene: 'A Japanese Oni, a massive red-skinned ogre with two horns and wild hair, wearing tiger-skin loincloth, swinging an iron kanabo club, standing on a bridge in a bamboo forest, storm lightning behind',
    faction: 'DEMONIC',
    comp: 'HERO',
  },

  // === IRONWRIGHT — Construct/Forge mythology ===
  {
    name: 'The Golem',
    scene: 'A Jewish Golem of Prague, a massive humanoid of rough clay with Hebrew letters carved on its forehead, cracks glowing with inner light, standing in a narrow medieval ghetto street, towering over rooftops, rain falling',
    faction: 'IRONWRIGHT',
    comp: 'ENV',
  },
  {
    name: 'Bronze Talos',
    scene: 'The Greek bronze giant Talos striding through shallow coastal waters, body of hammered bronze with visible rivets, one hand shielding its face from arrows, ships fleeing in the harbor, volcanic island behind, enormous scale',
    faction: 'IRONWRIGHT',
    comp: 'ENV',
  },

  // === RUINS — Mythological locations ===
  {
    name: 'The Labyrinth',
    scene: 'Looking down a long corridor of the Cretan Labyrinth, ancient stone walls covered in faded frescoes of bulls, bones scattered on the floor, a distant red glow around a corner, thread trailing along the ground, oppressive and claustrophobic',
    faction: 'NEUTRAL',
    comp: 'NAR',
    type: 'PLANAR_RUIN',
  },
  {
    name: 'Yggdrasil Root',
    scene: 'An enormous root of the Norse world tree Yggdrasil breaking through stone into an underground cavern, the root itself the size of a building, glowing runes carved into its bark, a spring of silver water at its base, Nidhogg bite marks',
    faction: 'NEUTRAL',
    comp: 'ENV',
    type: 'PLANAR_RUIN',
  },
];

function curlPost(url, body, timeoutSec = 60) {
  const tmpFile = `/tmp/fal-v11-${Date.now()}-${Math.random().toString(36).slice(2)}.json`;
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
  console.log('\n=== V11 Mythological Creatures (20 cards) ===\n');
  console.log('All creatures anchored to iconic public domain mythology');
  console.log('Fey: kelpie, satyr, erlking, dullahan | Celestial: valkyrie, griffin, phoenix, sphinx');
  console.log('Endless: draugr, ghoul, nosferatu, morrigan | Demonic: minotaur, ifrit, manticore, oni');
  console.log('Ironwright: golem, talos | Ruins: labyrinth, yggdrasil');
  console.log(`Cost: ~$${(CARDS.length * 0.025).toFixed(2)}\n`);

  const results = [];
  for (let i = 0; i < CARDS.length; i++) {
    const card = CARDS[i];
    const prompt = `${card.scene}, ${STYLE}`;
    const typeSlug = card.type === 'PLANAR_RUIN' ? 'ruin' : card.faction.toLowerCase().replace(/_/g, '-');
    const fileName = `V11-${typeSlug}-${String(i + 1).padStart(2, '0')}.png`;
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

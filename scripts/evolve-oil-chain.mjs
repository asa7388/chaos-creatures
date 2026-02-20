#!/usr/bin/env node
// evolve-oil-chain.mjs — Full 2-pass evolution chain using Oil_Painting LoRA
// BASE → Uncommon → Rare for 7 selected cards

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PREVIEW_DIR = join(__dirname, 'preview');

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

const OIL_LORA_URL = 'https://huggingface.co/Owen777/Kontext-Style-Loras/resolve/main/Oil_Painting_lora_weights.safetensors';
const OIL_SCALE = 1.0;

const STYLE_SUFFIX =
  'Keep the same color palette and lighting. ' +
  'Maintain thick palette knife oil painting style with visible heavy brushstrokes and impasto texture. ' +
  'Do not change the background, composition, or camera angle.';

// Uncommon prompts (same as evolve-all-pro.mjs)
const ORDER_UNC = {
  IRONWRIGHT: [
    'Add reinforced iron armor plates bolted over the shoulders and chest. Add glowing reactor crystal nodes at every joint. Add a structured halo of orbiting hydraulic components floating behind the head.',
    'Add polished chrome reinforcement panels over the torso. Add geometric blue rune etchings across the hull. Add a crown of iron sensor masts rising from the skull.',
  ],
  FEY_COURTS: [
    'Add golden crystalline patterns along the wing and limb edges. Add a small crown of amber light floating above the head. Add faint silver sigils glowing across the skin.',
    'Add a suit of bark-plate armor growing over the body in geometric patterns. Add glowing golden sap veins pulsing beneath the surface. Add new leaf-wing structures sprouting from the back.',
  ],
  DEMONIC: [
    'Add dark obsidian crystal growths on the shoulders. Add glowing infernal runes etched into the chest armor. Add longer sharper spiraling horns.',
    'Add chains fused into the body forming living armor with burning sigil links. Add a third eye glowing molten gold on the forehead. Add bone spur pauldrons on the shoulders.',
  ],
};
const CHAOS_UNC = {
  IRONWRIGHT: [
    'Add cracked glowing red vents along the torso. Add extra exhaust pipes belching wild uncontrolled flames from the back. Add sparking exposed wires bursting from the joints.',
    'Add pistons pumping through cracks in the hull. Add one arm mutated into an oversized cannon barrel glowing red hot. Add bolts and rivets popping loose across the strained body.',
  ],
  FEY_COURTS: [
    'Add jagged thorns erupting from the joints and spine. Add glowing green-purple veins cracking through the bark. Add toxic mushrooms sprouting from the shoulders.',
    'Add extra branches sprouting at unnatural angles. Add blood-red and toxic purple leaves replacing the original foliage. Add a cloud of glowing spores emanating from the body.',
  ],
  DEMONIC: [
    'Add deep glowing lava cracks split across the entire body. Add a massive corona of wild hellfire erupting from the back and shoulders. Add new smaller horns sprouting along the spine.',
    'Add extra eyes opening across the body glowing different colors. Add new bone spurs and extra clawed appendages bursting through the skin. Add dark energy radiating in visible shockwaves.',
  ],
};

// Rare prompts (more dramatic)
const ORDER_RARE = {
  IRONWRIGHT: [
    'Add a full suit of ornate gold-trimmed plate armor encasing the body. Add a massive glowing power core visible in the chest cavity. Add twin exhaust towers rising from the back crackling with blue energy.',
    'Add layered adamantine armor with glowing circuit patterns. Add a visor of burning white light replacing the eyes. Add reinforced mechanical wings folded against the back.',
  ],
  FEY_COURTS: [
    'Add a full crown of living crystal branches growing from the head glowing with inner light. Add armor made of interlocking bark plates with golden rune inlays. Add large luminous moth wings sprouting from the back.',
    'Add a mantle of woven starlight draped over the shoulders. Add crystallized amber gauntlets encasing the hands. Add antlers of pure white bone growing from the temples.',
  ],
  DEMONIC: [
    'Add massive curved ram horns replacing the original horns. Add full plate armor of blackened bone fused to the body. Add glowing red sigils carved into every surface of the armor.',
    'Add a crown of dark iron thorns welded to the skull. Add heavy chain armor links fused into the flesh across the torso. Add twin blades of obsidian growing from the forearms.',
  ],
};
const CHAOS_RARE = {
  IRONWRIGHT: [
    'Add multiple mechanical arms bursting from the sides in different stages of assembly. Add cracks across the hull leaking pressurized reactor coolant and sparks. Add a second smaller head emerging from the shoulder.',
    'Add massive tesla coils erupting from the back arcing wild electricity. Add hull plates buckling outward from internal pressure. Add a third leg growing from the hip still forming.',
  ],
  FEY_COURTS: [
    'Add massive thorn antlers growing wildly in all directions. Add bioluminescent fungal growths covering the shoulders and back. Add roots bursting from the legs anchoring into the ground.',
    'Add a second face emerging from the bark of the chest. Add vines erupting from every joint writhing independently. Add a halo of toxic spores and floating seeds surrounding the head.',
  ],
  DEMONIC: [
    'Add a second pair of arms bursting from the ribs. Add deep cracks across the body revealing molten core beneath. Add a massive tail of fused bone and hellfire trailing behind.',
    'Add dozens of small screaming faces pushing through the skin. Add wings of raw exposed muscle and bone ripping from the back. Add a corona of dark energy distorting the air around the body.',
  ],
};

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

const CARDS = [
  { baseFile: 'BASE-demon-r1-demon-b03.png', specId: 'demon-b03', faction: 'DEMONIC', name: 'Plague Blossom Crawler', manaCost: 3 },
  { baseFile: 'BASE-demon-r1-demon-b04.png', specId: 'demon-b04', faction: 'DEMONIC', name: 'Mirror Stalker', manaCost: 4 },
  { baseFile: 'BASE-fey-r1-fey-b01.png', specId: 'fey-b01', faction: 'FEY_COURTS', name: 'Thorn Sprite', manaCost: 1 },
  { baseFile: 'BASE-fey-r1-fey-b02.png', specId: 'fey-b02', faction: 'FEY_COURTS', name: 'Bog Troll Lurker', manaCost: 2 },
  { baseFile: 'BASE-fey-r1-fey-b03.png', specId: 'fey-b03', faction: 'FEY_COURTS', name: 'Briar Court Sentinel', manaCost: 3 },
  { baseFile: 'BASE-iron-r1-iron-b04.png', specId: 'iron-b04', faction: 'IRONWRIGHT', name: 'Gilded Ledger-Keeper', manaCost: 3 },
  { baseFile: 'BASE-iron-r1-iron-b05.png', specId: 'iron-b05', faction: 'IRONWRIGHT', name: 'Sapper Salamander', manaCost: 5 },
];

async function callKontextLora(body) {
  const maxRetries = 3;
  let delay = 3000;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch('https://fal.run/fal-ai/flux-kontext-lora', {
      method: 'POST',
      headers: { 'Authorization': `Key ${FAL_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (response.ok) return await response.json();
    const errText = await response.text();
    if (response.status === 422) throw new Error(`422: ${errText}`);
    if ((response.status === 429 || response.status >= 500) && attempt < maxRetries) {
      console.log(`    ${response.status}, retrying...`);
      await new Promise(r => setTimeout(r, delay));
      delay *= 2;
      continue;
    }
    throw new Error(`HTTP ${response.status}: ${errText}`);
  }
}

async function evolveOne(inputPath, prompt, outputFile) {
  const buf = readFileSync(inputPath);
  const dataUri = `data:image/png;base64,${buf.toString('base64')}`;

  const t0 = Date.now();
  const result = await callKontextLora({
    image_url: dataUri,
    prompt,
    loras: [{ path: OIL_LORA_URL, scale: OIL_SCALE }],
    guidance_scale: 2.5,
    num_inference_steps: 28,
    output_format: 'png',
    enable_safety_checker: true,
  });
  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);

  if (result.has_nsfw_concepts?.[0]) throw new Error('NSFW detected');
  if (!result.images?.[0]?.url) throw new Error('No image URL');

  const img = await fetch(result.images[0].url);
  const imgBuf = Buffer.from(await img.arrayBuffer());
  const outPath = join(PREVIEW_DIR, outputFile);
  writeFileSync(outPath, imgBuf);
  console.log(`    Saved: ${outputFile} (${(imgBuf.length / 1024).toFixed(0)}KB, ${elapsed}s)`);
  return { seed: result.seed };
}

async function main() {
  console.log('\n=== Oil_Painting LoRA — Full 2-Pass Chain ===\n');

  const results = [];

  for (const card of CARDS) {
    console.log(`\n--- ${card.name} (${card.faction}) ---`);
    const basePath = join(PREVIEW_DIR, card.baseFile);
    if (!existsSync(basePath)) { console.log('  Base not found, skip'); continue; }

    try {
      // Pass 1: BASE → Uncommon
      const dir1 = Math.random() < 0.5 ? 'ORDER' : 'CHAOS';
      const pool1 = dir1 === 'ORDER' ? ORDER_UNC : CHAOS_UNC;
      const prompt1 = pick(pool1[card.faction]) + ' ' + STYLE_SUFFIX;
      const uncFile = card.baseFile.replace('.png', '-evo-oil.png');

      console.log(`  Pass 1 [${dir1}]: BASE → Uncommon`);
      const r1 = await evolveOne(basePath, prompt1, uncFile);

      // Pass 2: Uncommon → Rare
      const dir2 = Math.random() < 0.5 ? 'ORDER' : 'CHAOS';
      const pool2 = dir2 === 'ORDER' ? ORDER_RARE : CHAOS_RARE;
      const prompt2 = pick(pool2[card.faction]) + ' ' + STYLE_SUFFIX;
      const rareFile = card.baseFile.replace('.png', '-rare-oil.png');

      console.log(`  Pass 2 [${dir2}]: Uncommon → Rare`);
      const r2 = await evolveOne(join(PREVIEW_DIR, uncFile), prompt2, rareFile);

      results.push({
        specId: card.specId, faction: card.faction, name: card.name, manaCost: card.manaCost,
        baseFile: card.baseFile, uncFile, rareFile,
        dir1, dir2, seed1: r1.seed, seed2: r2.seed,
      });
    } catch (err) {
      console.error(`  FAILED: ${err.message}`);
      results.push({ specId: card.specId, name: card.name, error: err.message });
    }
  }

  writeFileSync(join(PREVIEW_DIR, 'oil-chain-manifest.json'), JSON.stringify(results, null, 2));
  console.log(`\nComplete: ${results.filter(r => !r.error).length}/${CARDS.length} chains`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });

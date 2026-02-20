#!/usr/bin/env node
// evolve-rare-pro.mjs — Evolve 7 selected Uncommon cards to Rare using Kontext Pro
// This is the second evolution pass — testing compound drift.

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

const STYLE_SUFFIX =
  'Keep the same color palette and lighting. ' +
  'Maintain thick palette knife oil painting style with visible heavy brushstrokes and impasto texture. ' +
  'Do not change the background, composition, or camera angle.';

// Rare-tier prompts — more dramatic additions than Uncommon
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

// Cards to evolve — input is the Uncommon evo-pro image
const CARDS = [
  { evoFile: 'BASE-demon-r1-demon-b03-evo-pro.png', specId: 'demon-b03', faction: 'DEMONIC', name: 'Plague Blossom Crawler', manaCost: 3 },
  { evoFile: 'BASE-demon-r1-demon-b04-evo-pro.png', specId: 'demon-b04', faction: 'DEMONIC', name: 'Mirror Stalker', manaCost: 4 },
  { evoFile: 'BASE-fey-r1-fey-b02-evo-pro.png', specId: 'fey-b02', faction: 'FEY_COURTS', name: 'Bog Troll Lurker', manaCost: 2 },
  { evoFile: 'BASE-fey-r1-fey-b01-evo-pro.png', specId: 'fey-b01', faction: 'FEY_COURTS', name: 'Thorn Sprite', manaCost: 1 },
  { evoFile: 'BASE-fey-r1-fey-b03-evo-pro.png', specId: 'fey-b03', faction: 'FEY_COURTS', name: 'Briar Court Sentinel', manaCost: 3 },
  { evoFile: 'BASE-iron-r1-iron-b05-evo-pro.png', specId: 'iron-b05', faction: 'IRONWRIGHT', name: 'Sapper Salamander', manaCost: 5 },
  { evoFile: 'BASE-iron-r1-iron-b04-evo-pro.png', specId: 'iron-b04', faction: 'IRONWRIGHT', name: 'Gilded Ledger-Keeper', manaCost: 3 },
];

async function callKontextPro(body) {
  const maxRetries = 3;
  let delay = 3000;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch('https://fal.run/fal-ai/flux-pro/kontext', {
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

async function main() {
  console.log('\n=== Rare Evolution (Kontext Pro, 7 cards) ===\n');

  const results = [];
  for (const card of CARDS) {
    const inputPath = join(PREVIEW_DIR, card.evoFile);
    if (!existsSync(inputPath)) { console.log(`  Skip: ${card.evoFile} not found`); continue; }

    const direction = Math.random() < 0.5 ? 'ORDER' : 'CHAOS';
    const pool = direction === 'ORDER' ? ORDER_RARE : CHAOS_RARE;
    const instruction = pick(pool[card.faction]);
    const prompt = instruction + ' ' + STYLE_SUFFIX;

    const baseBuffer = readFileSync(inputPath);
    const dataUri = `data:image/png;base64,${baseBuffer.toString('base64')}`;

    console.log(`  [${direction}] ${card.name} (${card.faction})`);
    try {
      const t0 = Date.now();
      const result = await callKontextPro({
        image_url: dataUri,
        prompt,
        guidance_scale: 2.5,
        num_inference_steps: 28,
        output_format: 'png',
      });
      const elapsed = ((Date.now() - t0) / 1000).toFixed(1);

      if (result.has_nsfw_concepts?.[0]) throw new Error('NSFW detected');
      if (!result.images?.[0]?.url) throw new Error('No image URL');

      const img = await fetch(result.images[0].url);
      const buf = Buffer.from(await img.arrayBuffer());
      const outFile = card.evoFile.replace('-evo-pro.png', '-rare-pro.png');
      writeFileSync(join(PREVIEW_DIR, outFile), buf);
      console.log(`  Saved: ${outFile} (${(buf.length / 1024).toFixed(0)}KB, ${elapsed}s)`);

      results.push({ specId: card.specId, faction: card.faction, name: card.name,
        manaCost: card.manaCost, direction, rarity: 'RARE',
        fileName: outFile, inputFile: card.evoFile, seed: result.seed });
    } catch (err) {
      console.error(`  FAILED: ${card.name} — ${err.message}`);
      results.push({ specId: card.specId, name: card.name, error: err.message });
    }
  }

  writeFileSync(join(PREVIEW_DIR, 'rare-evo-pro-manifest.json'), JSON.stringify(results, null, 2));
  console.log(`\nEvolved: ${results.filter(r => !r.error).length}/${CARDS.length} cards`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });

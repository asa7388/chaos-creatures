#!/usr/bin/env node
// evolve-two-pass-pro.mjs — Two-pass evolution: Pro edit + LoRA re-texture
// Pass 1: Kontext Pro (evolution edit, preserves color + identity)
// Pass 2: EldritchPaletteKnife LoRA (texture restoration only, no content changes)
// Full chain: BASE → [Pro+LoRA] Uncommon → [Pro+LoRA] Rare

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

const LORA_URL = 'https://huggingface.co/EldritchAdam/SDXL_Eldritch_LoRAs/resolve/main/EldritchPaletteKnife.safetensors';
const LORA_SCALE = 0.5;

// Pro edit style suffix (color + composition preservation)
const PRO_STYLE =
  'Keep the same color palette and lighting. ' +
  'Do not change the background, composition, or camera angle.';

// LoRA re-texture prompt (ONLY about texture, no content changes)
const RETEXTURE_PROMPT =
  'Do not change the subject, composition, colors, or lighting in any way. ' +
  'Apply thick palette knife oil painting texture with heavy three-dimensional impasto brushstrokes across every surface. ' +
  'Make the paint texture feel tangible and physical with visible ridges of thick oil paint.';

const ORDER_UNC = {
  IRONWRIGHT: [
    'Add reinforced iron armor plates bolted over the shoulders and chest. Add glowing reactor crystal nodes at every joint. Add a structured halo of orbiting hydraulic components floating behind the head.',
  ],
  FEY_COURTS: [
    'Add golden crystalline patterns along the wing and limb edges. Add a small crown of amber light floating above the head. Add faint silver sigils glowing across the skin.',
  ],
  DEMONIC: [
    'Add dark obsidian crystal growths on the shoulders. Add glowing infernal runes etched into the chest armor. Add longer sharper spiraling horns.',
  ],
};
const CHAOS_UNC = {
  IRONWRIGHT: [
    'Add cracked glowing red vents along the torso. Add extra exhaust pipes belching wild uncontrolled flames from the back. Add sparking exposed wires bursting from the joints.',
  ],
  FEY_COURTS: [
    'Add jagged thorns erupting from the joints and spine. Add glowing green-purple veins cracking through the bark. Add toxic mushrooms sprouting from the shoulders.',
  ],
  DEMONIC: [
    'Add deep glowing lava cracks split across the entire body. Add a massive corona of wild hellfire erupting from the back and shoulders. Add new smaller horns sprouting along the spine.',
  ],
};
const ORDER_RARE = {
  IRONWRIGHT: [
    'Add a full suit of ornate gold-trimmed plate armor encasing the body. Add a massive glowing power core visible in the chest cavity. Add twin exhaust towers rising from the back crackling with blue energy.',
  ],
  FEY_COURTS: [
    'Add a full crown of living crystal branches growing from the head glowing with inner light. Add armor made of interlocking bark plates with golden rune inlays. Add large luminous moth wings sprouting from the back.',
  ],
  DEMONIC: [
    'Add massive curved ram horns replacing the original horns. Add full plate armor of blackened bone fused to the body. Add glowing red sigils carved into every surface of the armor.',
  ],
};
const CHAOS_RARE = {
  IRONWRIGHT: [
    'Add massive tesla coils erupting from the back arcing wild electricity. Add hull plates buckling outward from internal pressure. Add a third leg growing from the hip still forming.',
  ],
  FEY_COURTS: [
    'Add massive thorn antlers growing wildly in all directions. Add bioluminescent fungal growths covering the shoulders and back. Add roots bursting from the legs anchoring into the ground.',
  ],
  DEMONIC: [
    'Add a second pair of arms bursting from the ribs. Add deep cracks across the body revealing molten core beneath. Add a massive tail of fused bone and hellfire trailing behind.',
  ],
};

const CARDS = [
  { baseFile: 'BASE-fey-r1-fey-b02.png', specId: 'fey-b02', faction: 'FEY_COURTS', name: 'Bog Troll Lurker', manaCost: 2 },
  { baseFile: 'BASE-iron-r1-iron-b05.png', specId: 'iron-b05', faction: 'IRONWRIGHT', name: 'Sapper Salamander', manaCost: 5 },
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
    if (response.status === 422) throw new Error(`Pro 422: ${errText}`);
    if ((response.status === 429 || response.status >= 500) && attempt < maxRetries) {
      await new Promise(r => setTimeout(r, delay)); delay *= 2; continue;
    }
    throw new Error(`Pro HTTP ${response.status}: ${errText}`);
  }
}

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
    if (response.status === 422) throw new Error(`LoRA 422: ${errText}`);
    if ((response.status === 429 || response.status >= 500) && attempt < maxRetries) {
      await new Promise(r => setTimeout(r, delay)); delay *= 2; continue;
    }
    throw new Error(`LoRA HTTP ${response.status}: ${errText}`);
  }
}

function imgToDataUri(path) {
  return `data:image/png;base64,${readFileSync(path).toString('base64')}`;
}

async function saveResult(result, outPath) {
  if (result.has_nsfw_concepts?.[0]) throw new Error('NSFW detected');
  if (!result.images?.[0]?.url) throw new Error('No image URL');
  const img = await fetch(result.images[0].url);
  const buf = Buffer.from(await img.arrayBuffer());
  writeFileSync(outPath, buf);
  return buf.length;
}

async function evolveStep(inputPath, evoPrompt, outFileBase) {
  // Step A: Kontext Pro — evolution edit
  const proFile = outFileBase + '-edit.png';
  const proPath = join(PREVIEW_DIR, proFile);
  console.log(`    A: Pro edit...`);
  const t0 = Date.now();
  const proResult = await callKontextPro({
    image_url: imgToDataUri(inputPath),
    prompt: evoPrompt + ' ' + PRO_STYLE,
    guidance_scale: 2.5,
    num_inference_steps: 28,
    output_format: 'png',
  });
  const proSize = await saveResult(proResult, proPath);
  console.log(`       ${proFile} (${(proSize/1024).toFixed(0)}KB, ${((Date.now()-t0)/1000).toFixed(1)}s)`);

  // Step B: LoRA re-texture
  const texFile = outFileBase + '.png';
  const texPath = join(PREVIEW_DIR, texFile);
  console.log(`    B: LoRA re-texture...`);
  const t1 = Date.now();
  const loraResult = await callKontextLora({
    image_url: imgToDataUri(proPath),
    prompt: RETEXTURE_PROMPT,
    loras: [{ path: LORA_URL, scale: LORA_SCALE }],
    guidance_scale: 2.5,
    num_inference_steps: 28,
    output_format: 'png',
    enable_safety_checker: true,
  });
  const texSize = await saveResult(loraResult, texPath);
  console.log(`       ${texFile} (${(texSize/1024).toFixed(0)}KB, ${((Date.now()-t1)/1000).toFixed(1)}s)`);

  return texFile;
}

async function main() {
  console.log('\n=== Two-Pass: Pro Edit + LoRA Re-Texture ===\n');

  const results = [];
  for (const card of CARDS) {
    console.log(`\n--- ${card.name} (${card.faction}) ---`);
    const basePath = join(PREVIEW_DIR, card.baseFile);
    if (!existsSync(basePath)) { console.log('  Skip'); continue; }

    try {
      // Uncommon
      const dir1 = Math.random() < 0.5 ? 'ORDER' : 'CHAOS';
      const pool1 = dir1 === 'ORDER' ? ORDER_UNC : CHAOS_UNC;
      const prompt1 = pool1[card.faction][0];
      console.log(`  Uncommon [${dir1}]:`);
      const uncBase = card.baseFile.replace('.png', '-evo-2p');
      const uncFile = await evolveStep(basePath, prompt1, uncBase);

      // Rare
      const dir2 = Math.random() < 0.5 ? 'ORDER' : 'CHAOS';
      const pool2 = dir2 === 'ORDER' ? ORDER_RARE : CHAOS_RARE;
      const prompt2 = pool2[card.faction][0];
      console.log(`  Rare [${dir2}]:`);
      const rareBase = card.baseFile.replace('.png', '-rare-2p');
      const rareFile = await evolveStep(join(PREVIEW_DIR, uncFile), prompt2, rareBase);

      results.push({
        specId: card.specId, faction: card.faction, name: card.name, manaCost: card.manaCost,
        baseFile: card.baseFile, uncFile, rareFile, dir1, dir2,
      });
    } catch (err) {
      console.error(`  FAILED: ${err.message}`);
      results.push({ specId: card.specId, name: card.name, error: err.message });
    }
  }

  writeFileSync(join(PREVIEW_DIR, 'two-pass-pro-manifest.json'), JSON.stringify(results, null, 2));
  console.log(`\nComplete: ${results.filter(r => !r.error).length}/${CARDS.length} chains`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });

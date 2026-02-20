#!/usr/bin/env node
// evolve-preview.mjs — Evolve base preview cards from Common → Uncommon
// Uses FLUX Kontext img2img to transform existing card art locally.
//
// Usage:
//   node scripts/evolve-preview.mjs --manifest scripts/preview/BASE-iron-manifest.json
//
// Reads each card from the manifest, loads the base image, calls FLUX Kontext
// with an evolution prompt, and saves the evolved image + manifest to preview/.

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PREVIEW_DIR = join(__dirname, 'preview');

// Load env
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

// CLI
function getArg(name) {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx === -1 || !process.argv[idx + 1]) return null;
  return process.argv[idx + 1];
}
const MANIFEST_PATH = getArg('manifest');
if (!MANIFEST_PATH) { console.error('Missing --manifest'); process.exit(1); }

// ==========================================================================
// Evolution transform templates
// ==========================================================================

const NEGATIVE_PROMPT =
  'text, words, letters, watermarks, signatures, logos, borders, frames, NSFW, ' +
  'gore, distorted anatomy, multiple heads, deformed limbs, extra limbs, ' +
  '3d render, CGI, photorealistic, airbrushed, smooth, digital art, ' +
  'white background, collage, grid layout, concept art sheet, turnaround sheet';

// ORDER evolutions: physical upgrades — new armor, crystalline growths, structured additions
const ORDER_TRANSFORMS = {
  IRONWRIGHT: [
    'This creature has evolved. It now has thick new reinforced iron armor plates bolted over its shoulders and chest. Glowing reactor crystal nodes have grown at every joint. New hydraulic pistons extend along its limbs. A structured halo of orbiting hydraulic components floats behind its head.',
    'This creature has evolved. Polished chrome reinforcement panels cover its torso and limbs. Geometric rune etchings glow bright blue across its hull. A crown of precisely aligned iron sensor masts rises from its skull. Additional weapon attachments have been mounted on its arms.',
  ],
  FEY_COURTS: [
    'This creature has evolved. Crystallized amber growths have formed along its spine like a ridge of golden jewels. Its antlers or horns have grown larger and branch into intricate fractal patterns. Luminous silver-white sigils are now visible across its skin. A crown of living flowers blooms from its head.',
    'This creature has evolved. A full suit of bark-plate armor has grown over its body in geometric tessellations. Glowing golden sap veins pulse visibly beneath the surface. New moth-wing or leaf-wing structures have sprouted from its back. Its eyes now emit beams of soft moonlight.',
  ],
  DEMONIC: [
    'This creature has evolved. A crown of dark obsidian crystals has grown from its skull. Ornate black iron armor plates have formed over its chest and shoulders with glowing infernal runes etched into each piece. Its horns are longer and spiral elegantly. Dark gemstones are embedded at each joint.',
    'This creature has evolved. Chains have fused into its body forming living armor with each link inscribed with burning sigils. A third eye has opened on its forehead glowing molten gold. Bone spurs have grown into structured shoulder pauldrons. Its claws are now encased in crystallized hellfire.',
  ],
};

// CHAOS evolutions: mutations — extra limbs, wild growths, unstable energy, physical corruption
const CHAOS_TRANSFORMS = {
  IRONWRIGHT: [
    'This creature has evolved through chaos. Its metal hull has cracked open and wild arcs of red electricity crackle from the gaps. Two extra mechanical arms have sprouted from its back at wrong angles. Exhaust pipes have multiplied and belch uncontrolled flames. Gears protrude through its skin spinning erratically.',
    'This creature has evolved through chaos. The machinery inside has gone haywire — pistons pump through the hull, gears grind visibly through cracks in the armor. One arm has mutated into an oversized cannon barrel glowing red hot. Bolts and rivets pop loose as the body strains to contain the energy within.',
  ],
  FEY_COURTS: [
    'This creature has evolved through chaos. Massive thorns and brambles have erupted from its joints and spine forming a wild spiky crest. Its eyes now burn bright predatory green fire. The bark of its body has cracked open revealing wild purple-green chaos energy pulsing underneath. Toxic mushrooms sprout across its shoulders.',
    'This creature has evolved through chaos. Extra limbs or branches have sprouted at unnatural angles. Its leaves have turned blood-red and toxic purple. A cloud of glowing spores constantly emanates from its body. New mouths with thorn-teeth have opened in its torso. Bioluminescent veins crackle erratically across its whole form.',
  ],
  DEMONIC: [
    'This creature has evolved through chaos. Deep glowing lava cracks have split open across its entire body revealing the molten interior. A massive corona of wild hellfire erupts from its back and shoulders like burning wings. Its horns have doubled in size and new smaller horns sprout from its spine. The ground beneath it is scorched and melting.',
    'This creature has evolved through chaos. Extra eyes have opened across its body glowing different colors. Its form has partially split into two overlapping versions of itself like a glitch. New bone spurs and extra clawed appendages have burst through its skin. Dark energy radiates from it in visible shockwaves warping the air.',
  ],
};

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function getTransform(factionKey) {
  // 50/50 ORDER vs CHAOS
  const direction = Math.random() < 0.5 ? 'ORDER' : 'CHAOS';
  const pool = direction === 'ORDER' ? ORDER_TRANSFORMS : CHAOS_TRANSFORMS;
  const transforms = pool[factionKey] || pool.IRONWRIGHT;
  return { direction, instruction: pick(transforms) };
}

// Style anchor for evolution (matches base generation style)
const STYLE_ANCHOR =
  'palette knife painting, dark atmospheric fantasy, rich saturated colors, ' +
  'dramatic lighting, deep shadows, chiaroscuro, heavy paint texture, ' +
  'layered palette knife strokes, masterwork fantasy illustration, ' +
  'traditional oil painting on canvas, ' +
  'no text no borders no UI no watermarks';

// LoRA config — same as base generation
const LORA_URL = 'https://huggingface.co/EldritchAdam/SDXL_Eldritch_LoRAs/resolve/main/EldritchPaletteKnife.safetensors';
const LORA_SCALE = 0.9;

// ==========================================================================
// fal.ai fast-sdxl (same model + LoRA as base generation, queue mode)
// ==========================================================================

function curlPost(url, body, timeoutSec = 30) {
  const tmpFile = `/tmp/fal-evo-${Date.now()}-${Math.random().toString(36).slice(2)}.json`;
  writeFileSync(tmpFile, JSON.stringify(body));
  try {
    const result = execFileSync('curl', [
      '-s', '--max-time', String(timeoutSec),
      '-X', 'POST', url,
      '-H', `Authorization: Key ${FAL_KEY}`,
      '-H', 'Content-Type: application/json',
      '-d', `@${tmpFile}`,
    ], { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });
    return JSON.parse(result);
  } finally {
    try { execFileSync('rm', [tmpFile]); } catch {}
  }
}

function curlGet(url, timeoutSec = 30) {
  const result = execFileSync('curl', [
    '-s', '--max-time', String(timeoutSec),
    '-H', `Authorization: Key ${FAL_KEY}`,
    url,
  ], { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });
  return JSON.parse(result);
}

async function callFalSD(body) {
  const endpoint = 'fal-ai/fast-sdxl';
  const submitResult = curlPost(`https://queue.fal.run/${endpoint}`, body, 60);
  if (submitResult.detail) throw new Error(`fal.ai submit error: ${JSON.stringify(submitResult.detail)}`);
  const requestId = submitResult.request_id;
  if (!requestId) throw new Error(`No request_id: ${JSON.stringify(submitResult)}`);

  const pollUrl = `https://queue.fal.run/${endpoint}/requests/${requestId}/status`;
  const t0 = Date.now();
  let queueDone = false;
  while (!queueDone) {
    const elapsed = ((Date.now() - t0) / 1000).toFixed(0);
    const status = curlGet(pollUrl, 15);
    if (status.status === 'COMPLETED') { queueDone = true; }
    else if (status.status === 'FAILED') { throw new Error(`fal.ai failed: ${JSON.stringify(status)}`); }
    else {
      process.stdout.write(`    Waiting ${elapsed}s (${status.status})...\r`);
      execFileSync('sleep', ['2']);
    }
  }
  const totalWait = ((Date.now() - t0) / 1000).toFixed(1);
  const resultUrl = `https://queue.fal.run/${endpoint}/requests/${requestId}`;
  const result = curlGet(resultUrl, 30);
  if (result.detail) throw new Error(`fal.ai fetch error: ${JSON.stringify(result.detail)}`);
  console.log(`    fal.ai time: ${totalWait}s`);
  return result;
}

// ==========================================================================
// Evolve one card
// ==========================================================================

async function evolveCard(card) {
  const { direction, instruction } = getTransform(card.faction);

  const baseImagePath = join(PREVIEW_DIR, card.fileName);
  if (!existsSync(baseImagePath)) {
    throw new Error(`Base image not found: ${baseImagePath}`);
  }

  // Read base image as base64
  const baseBuffer = readFileSync(baseImagePath);
  const dataUri = `data:image/png;base64,${baseBuffer.toString('base64')}`;

  // Transformation instruction FIRST = highest CLIP weight, then style anchor
  const prompt = [
    instruction,
    STYLE_ANCHOR,
  ].join('. ');

  console.log(`  [${direction}] ${card.archetype} → Uncommon`);

  // Use same model + LoRA as base generation, with img2img
  const request = {
    prompt,
    negative_prompt: NEGATIVE_PROMPT,
    image_url: dataUri,
    strength: direction === 'ORDER' ? 0.55 : 0.65,
    image_size: 'portrait_4_3',
    num_inference_steps: 25,
    guidance_scale: 7.5,
    num_images: 1,
    enable_safety_checker: true,
    format: 'png',
    loras: [{ path: LORA_URL, scale: LORA_SCALE }],
  };

  const result = await callFalSD(request);

  if (result.has_nsfw_concepts?.[0]) {
    throw new Error('NSFW detected');
  }
  if (!result.images?.[0]?.url) {
    throw new Error('No image URL in response');
  }

  // Download evolved image
  const imgResponse = await fetch(result.images[0].url);
  if (!imgResponse.ok) throw new Error(`Download failed: ${imgResponse.status}`);
  const imageBuffer = Buffer.from(await imgResponse.arrayBuffer());

  // Save with EVO prefix
  const evoFileName = card.fileName.replace('.png', '-evo.png');
  const evoPath = join(PREVIEW_DIR, evoFileName);
  writeFileSync(evoPath, imageBuffer);
  console.log(`  Saved: ${evoFileName} (${(imageBuffer.length / 1024).toFixed(0)}KB, seed: ${result.seed})`);

  return {
    agent: card.agent,
    run: card.run,
    fileName: evoFileName,
    baseFileName: card.fileName,
    specId: card.specId,
    faction: card.faction,
    archetype: card.archetype,
    originalArchetype: card.originalArchetype || card.archetype,
    composition: card.composition,
    rarity: 'UNCOMMON',
    baseRarity: 'COMMON',
    keywords: card.keywords,
    manaCost: card.manaCost,
    seed: result.seed,
    direction,
    type: 'evolution',
    strength: request.strength,
  };
}

// ==========================================================================
// Main
// ==========================================================================

async function main() {
  const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf-8'));
  console.log(`\n=== Evolving ${manifest.length} cards (Common → Uncommon) ===\n`);

  const results = [];
  for (const card of manifest) {
    if (card.error) { console.log(`  Skipping ${card.specId} (had error)`); continue; }
    try {
      const evo = await evolveCard(card);
      results.push(evo);
    } catch (err) {
      console.error(`  FAILED: ${card.archetype} — ${err.message}`);
      results.push({ ...card, error: err.message, type: 'evolution' });
    }
  }

  // Save evolution manifest
  const evoManifestName = MANIFEST_PATH.replace(/-manifest\.json$/, '-evo-manifest.json')
    .replace(/^.*\//, '');
  const evoManifestPath = join(PREVIEW_DIR, evoManifestName);
  writeFileSync(evoManifestPath, JSON.stringify(results, null, 2));
  console.log(`\nEvolution manifest: ${evoManifestName}`);
  console.log(`Evolved: ${results.filter(r => !r.error).length}/${manifest.length} cards`);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});

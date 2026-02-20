#!/usr/bin/env node
// Retry single failed card with Kontext Pro

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

const STYLE_SUFFIX =
  'Keep the same color palette and lighting. ' +
  'Maintain thick palette knife oil painting style with visible heavy brushstrokes and impasto texture. ' +
  'Do not change the background, composition, or camera angle.';

async function callKontextPro(body) {
  const response = await fetch('https://fal.run/fal-ai/flux-pro/kontext', {
    method: 'POST',
    headers: { 'Authorization': `Key ${FAL_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  return await response.json();
}

async function main() {
  // Retry demon-b02 with ORDER prompt (less likely to trigger NSFW)
  const baseFile = 'BASE-demon-r1-demon-b02.png';
  const basePath = join(PREVIEW_DIR, baseFile);
  const baseBuffer = readFileSync(basePath);
  const dataUri = `data:image/png;base64,${baseBuffer.toString('base64')}`;

  const instruction = 'Add dark obsidian crystal growths on the shoulders. Add glowing infernal runes etched into the chest armor. Add longer sharper spiraling horns.';
  const prompt = instruction + ' ' + STYLE_SUFFIX;

  console.log('Retrying demon-b02 (ORDER)...');
  const t0 = Date.now();
  const result = await callKontextPro({
    image_url: dataUri,
    prompt,
    guidance_scale: 2.5,
    num_inference_steps: 28,
    output_format: 'png',
  });
  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);

  if (result.has_nsfw_concepts?.[0]) throw new Error('NSFW again');
  if (!result.images?.[0]?.url) throw new Error('No image');

  const img = await fetch(result.images[0].url);
  const buf = Buffer.from(await img.arrayBuffer());
  const outFile = 'BASE-demon-r1-demon-b02-evo-pro.png';
  writeFileSync(join(PREVIEW_DIR, outFile), buf);
  console.log(`Saved: ${outFile} (${(buf.length / 1024).toFixed(0)}KB, seed: ${result.seed}, ${elapsed}s)`);

  // Update the manifest
  const manifestPath = join(PREVIEW_DIR, 'BASE-demon-r1-evo-pro-manifest.json');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
  const baseManifest = JSON.parse(readFileSync(join(PREVIEW_DIR, 'BASE-demon-r1-manifest.json'), 'utf-8'));
  const card = baseManifest.find(c => c.specId === 'demon-b02');

  // Replace the failed entry
  const idx = manifest.findIndex(m => m.specId === 'demon-b02' || (m.error && m.specId === 'demon-b02'));
  const entry = {
    agent: card.agent, run: card.run,
    fileName: outFile, baseFileName: card.fileName,
    specId: card.specId, faction: card.faction,
    archetype: card.archetype,
    originalArchetype: card.originalArchetype || card.archetype,
    composition: card.composition,
    rarity: 'UNCOMMON', baseRarity: 'COMMON',
    keywords: card.keywords, manaCost: card.manaCost,
    seed: result.seed, direction: 'ORDER',
    type: 'evolution', pipeline: 'kontext-pro',
  };
  if (idx >= 0) manifest[idx] = entry;
  else manifest.splice(1, 0, entry); // insert at position 1

  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log('Manifest updated.');
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });

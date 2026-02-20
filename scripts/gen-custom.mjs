#!/usr/bin/env node
// Quick custom prompt test — generates a single image from a hand-written prompt.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PREVIEW_DIR = join(__dirname, 'preview');
const envPath = resolve(__dirname, '../packages/game-server/.env');
const envText = readFileSync(envPath, 'utf-8');
const env = {};
for (const line of envText.split('\n')) {
  const t = line.trim();
  if (!t || t.startsWith('#')) continue;
  const eq = t.indexOf('=');
  if (eq === -1) continue;
  env[t.slice(0, eq)] = t.slice(eq + 1);
}
const FAL_KEY = env.FAL_KEY;

const AGENT = process.argv[2] || 'N';
const RUN = process.argv[3] || '1';
const SLUG = process.argv[4] || 'custom';
const PROMPT = process.argv[5];

if (!PROMPT) {
  console.error('Usage: node gen-custom.mjs <agent> <run> <slug> "<prompt>"');
  process.exit(1);
}

const LORA_URL = 'https://huggingface.co/EldritchAdam/SDXL_Eldritch_LoRAs/resolve/main/EldritchPaletteKnife.safetensors';
const STYLE = 'palette knife painting, dark atmospheric fantasy, rich saturated colors, dramatic lighting, deep shadows, chiaroscuro, heavy paint texture, layered palette knife strokes, masterwork fantasy illustration, traditional oil painting on canvas, no text no borders no watermarks';
const fullPrompt = PROMPT + ', ' + STYLE;

const NEGATIVE = 'digital art, digital painting, concept art, artstation, 3d render, CGI, photorealistic, smooth gradients, airbrushed, plastic skin, neon, glowing outline, watermark, signature, text, words, letters, logos, borders, frames, ui elements, anime, manga, cel shading, flat color, cartoon, deformed, disfigured, bad anatomy, extra limbs, missing limbs, blurry, jpeg artifacts, low quality, worst quality, cropped, nudity, naked, bare chest, bare breasts, exposed skin, revealing clothing, nsfw, cleavage';

function curlPost(url, body) {
  const tmp = `/tmp/fal-custom-${Date.now()}.json`;
  writeFileSync(tmp, JSON.stringify(body));
  try {
    return JSON.parse(execFileSync('curl', ['-s', '--max-time', '30', '-X', 'POST', url,
      '-H', `Authorization: Key ${FAL_KEY}`, '-H', 'Content-Type: application/json',
      '-d', `@${tmp}`], { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 }));
  } finally { try { execFileSync('rm', [tmp]); } catch {} }
}

function curlGet(url) {
  return JSON.parse(execFileSync('curl', ['-s', '--max-time', '30',
    '-H', `Authorization: Key ${FAL_KEY}`, url], { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 }));
}

const endpoint = 'fal-ai/fast-sdxl';
console.log(`Generating: ${SLUG}`);
console.log(`Prompt: ${fullPrompt.substring(0, 200)}...`);

const sub = curlPost(`https://queue.fal.run/${endpoint}`, {
  prompt: fullPrompt, negative_prompt: NEGATIVE,
  image_size: 'portrait_4_3', num_inference_steps: 25, guidance_scale: 7.5,
  num_images: 1, enable_safety_checker: true, format: 'png',
  loras: [{ path: LORA_URL, scale: 0.9 }],
});
const rid = sub.request_id;
if (!rid) { console.error('No request_id:', JSON.stringify(sub)); process.exit(1); }

let done = false;
const t0 = Date.now();
while (!done) {
  const s = curlGet(`https://queue.fal.run/${endpoint}/requests/${rid}/status`);
  if (s.status === 'COMPLETED') done = true;
  else if (s.status === 'FAILED') { console.error('FAILED:', JSON.stringify(s)); process.exit(1); }
  else { process.stdout.write(`  Waiting ${((Date.now() - t0) / 1000).toFixed(0)}s (${s.status})...\r`); execFileSync('sleep', ['2']); }
}

const result = curlGet(`https://queue.fal.run/${endpoint}/requests/${rid}`);
const imgUrl = result.images[0].url;
const resp = await fetch(imgUrl);
const buf = Buffer.from(await resp.arrayBuffer());
const fname = `${AGENT}-r${RUN}-${SLUG}.png`;
if (!existsSync(PREVIEW_DIR)) mkdirSync(PREVIEW_DIR, { recursive: true });
writeFileSync(join(PREVIEW_DIR, fname), buf);
console.log(`\nSaved: ${fname} (${(buf.length / 1024).toFixed(0)}KB, seed: ${result.seed})`);

writeFileSync(join(PREVIEW_DIR, `${AGENT}-r${RUN}-manifest.json`), JSON.stringify([{
  agent: AGENT, run: parseInt(RUN), fileName: fname, specId: SLUG,
  faction: 'CUSTOM', archetype: SLUG.replace(/-/g, ' '),
  composition: 'CUSTOM', rarity: 'RARE', keywords: [],
  manaCost: 0, seed: result.seed, prompt: fullPrompt.substring(0, 500),
  loraUrl: LORA_URL, loraScale: 0.9, trigger: 'palette knife painting',
  styleExtra: 'custom'
}], null, 2));
console.log('Done!');

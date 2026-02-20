#!/usr/bin/env node
// Quick test of fal.ai DreamShaper XL endpoint
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
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

const body = {
  prompt: 'fantasy creature illustration in the style of Gustave Dore engravings, traditional oil painting, dark moody atmospheric, a squat mechanical golem with a furnace chest glowing orange, dented iron plates, heavy brushstrokes, muted earth tones',
  negative_prompt: 'text, watermarks, digital art, 3d render, smooth, airbrushed, CGI, clean lines, photorealistic',
  model_name: 'Lykon/dreamshaper-xl-1-0',
  image_size: 'portrait_4_3',
  num_inference_steps: 25,
  guidance_scale: 7.5,
  num_images: 1,
  enable_safety_checker: true,
  format: 'png',
};

console.log('Testing fal.ai DreamShaper XL endpoint...');
console.log('URL: https://fal.run/fal-ai/dreamshaper');

try {
  const response = await fetch('https://fal.run/fal-ai/dreamshaper', {
    method: 'POST',
    headers: {
      'Authorization': `Key ${FAL_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  console.log('HTTP Status:', response.status);
  const text = await response.text();
  console.log('Response:', text.substring(0, 500));
} catch (err) {
  console.error('Fetch error:', err.message);
  if (err.cause) console.error('Cause:', err.cause.message);
}

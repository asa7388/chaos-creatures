#!/usr/bin/env node
// train-style-lora.mjs — Assemble curated training set + submit to fal.ai FLUX LoRA training
// Curated 35 images: 6 per faction + 5 ruins, balanced compositions

import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync } from 'fs';
import { resolve, dirname, join, basename } from 'path';
import { fileURLToPath } from 'url';
import { execFileSync, execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PREVIEW_DIR = join(__dirname, 'preview');
const TRAIN_DIR = join(__dirname, 'preview', 'training-set');
if (!existsSync(TRAIN_DIR)) mkdirSync(TRAIN_DIR, { recursive: true });

// Load FAL_KEY
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

// === CURATED 35-IMAGE TRAINING SET ===
const TRAINING_SET = [
  // IRONWRIGHT (6)
  'pool-v2/V2-ironwright-01.png',       // Blocky construct in corridor — HERO
  'pool-v2/V2-ironwright-02.png',       // Vehicle in canyon strip-mine — ENV
  'pool-v5/V5-ironwright-01.png',       // Airship in clouds — AERIAL
  'pool-v8/V8-ironwright-03.png',       // Mech silhouette at sunset — SILHOUETTE
  'pool-v10/V10-ironwright-14.png',     // Blacksmith at forge — NAR
  'pool-v13/V13-ironwright-10.png',     // Walking fortress — ENV

  // FEY COURTS (6)
  'pool/fey-courts/creatures/BASE-fey-courts-pool-01.png',  // Tree monster close-up — CLOSE
  'pool/fey-courts/creatures/BASE-fey-courts-pool-02.png',  // Bug-fairy creature — HERO
  'pool-v5/V5-fey-courts-09.png',      // Underwater tentacle entity — UNUSUAL
  'pool-v7/V7-fey-courts-05.png',      // Hooded figure at candlelit table — NAR
  'pool-v10/V10-fey-courts-02.png',    // Cernunnos antlered god — NAR
  'pool-v12/V12-fey-courts-02.png',    // Dryad emerging from tree — ACT

  // DEMONIC (6)
  'pool-v2/V2-demonic-06.png',         // Red demon at desk — PORTRAIT
  'pool-v3/V3-demonic-05.png',         // Fire demon breaking chains — HERO
  'pool-v5/V5-demonic-03.png',         // Dragon eye close-up — CLOSE
  'pool-v7/V7-demonic-10.png',         // Devil in suit reading — PORTRAIT
  'pool-v10/V10-demonic-10.png',       // Sea dragon rising — ENV
  'pool-v13/V13-demonic-11.png',       // Rakshasa tiger in palace — NAR

  // CELESTIAL CRUSADE (6)
  'pool/celestial-crusade/creatures/BASE-celestial-crusade-pool-01.png',  // Winged reliquary — OBJ
  'pool-v2/V2-celestial-crusade-08.png',   // Knight kneeling at statue — NAR
  'pool-v5/V5-celestial-crusade-07.png',   // Winged knight on cliff — SILHOUETTE
  'pool-v9/V9-celestial-crusade-06.png',   // Seraph in flight — ACT
  'pool-v12/V12-celestial-crusade-06.png', // Griffin diving — AERIAL
  'pool-v13/V13-celestial-crusade-04.png', // Fallen angel two-figure — ENV

  // THE ENDLESS (6)
  'pool-v4/V4-the-endless-10.png',     // Ghost on frozen lake — ENV
  'pool-v7/V7-the-endless-03.png',     // Banshee queen portrait — PORTRAIT
  'pool-v8/V8-the-endless-01.png',     // Silhouette against red moon — SILHOUETTE
  'pool-v8/V8-the-endless-05.png',     // Armored knight group — GROUP
  'pool-v9/V9-the-endless-11.png',     // Plague doctor in graveyard — NAR
  'pool-v12/V12-the-endless-11.png',   // Vampire in gothic cathedral — NAR

  // RUINS (5)
  'pool-v3/V3-ruin-11.png',            // Underground blue pool — INTERIOR
  'pool-v5/V5-ruin-11.png',            // Spiral tower in storm — EXTERIOR
  'pool-v7/V7-ruin-11.png',            // Stone heads/faces room — INTERIOR
  'pool-v13/V13-ruin-16.png',          // Obsidian spire in desert — EXTERIOR
  'pool-v13/V13-ruin-17.png',          // Stone arch in ocean — EXTERIOR
];

function curlPost(url, body, timeoutSec = 120) {
  const tmpFile = `/tmp/fal-train-${Date.now()}.json`;
  writeFileSync(tmpFile, JSON.stringify(body));
  try {
    const result = execFileSync('curl', [
      '-s', '--max-time', String(timeoutSec),
      '-X', 'POST', url,
      '-H', `Authorization: Key ${FAL_KEY}`,
      '-H', 'Content-Type: application/json',
      '-d', `@${tmpFile}`,
    ], { encoding: 'utf-8', maxBuffer: 50 * 1024 * 1024 });
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

function curlUpload(filePath) {
  // Upload file to fal.ai storage
  const result = execFileSync('curl', [
    '-s', '--max-time', '300',
    '-X', 'POST',
    'https://fal.ai/api/storage/upload/initiate',
    '-H', `Authorization: Key ${FAL_KEY}`,
    '-H', 'Content-Type: application/json',
    '-d', JSON.stringify({
      file_name: basename(filePath),
      content_type: 'application/zip',
    }),
  ], { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });
  return JSON.parse(result);
}

async function main() {
  console.log('\n=== Style LoRA Training Pipeline ===\n');

  // Step 1: Copy curated images to training folder
  console.log('Step 1: Assembling training set...');
  let copied = 0;
  for (const relPath of TRAINING_SET) {
    const src = join(PREVIEW_DIR, relPath);
    if (!existsSync(src)) {
      console.error(`  MISSING: ${relPath}`);
      continue;
    }
    const destName = `train-${String(copied + 1).padStart(2, '0')}.png`;
    copyFileSync(src, join(TRAIN_DIR, destName));
    copied++;
  }
  console.log(`  Copied ${copied}/${TRAINING_SET.length} images to training-set/\n`);

  if (copied < TRAINING_SET.length) {
    console.error('Missing images! Aborting.');
    process.exit(1);
  }

  // Step 2: Resize images for training (1024px longest side, JPEG for smaller zip)
  console.log('Step 2: Resizing images for training...');
  const resizedDir = join(TRAIN_DIR, 'resized');
  if (!existsSync(resizedDir)) mkdirSync(resizedDir, { recursive: true });
  for (let i = 1; i <= copied; i++) {
    const src = join(TRAIN_DIR, `train-${String(i).padStart(2, '0')}.png`);
    const dst = join(resizedDir, `train-${String(i).padStart(2, '0')}.jpg`);
    if (existsSync(dst)) continue;
    execSync(`sips -Z 1024 -s format jpeg -s formatOptions 92 "${src}" --out "${dst}"`, { stdio: 'pipe' });
  }
  console.log(`  Resized ${copied} images to 1024px max, JPEG quality 92\n`);

  // Step 3: Create zip archive
  console.log('Step 3: Creating zip archive...');
  const zipPath = join(TRAIN_DIR, 'training-images.zip');
  execSync(`cd "${resizedDir}" && zip -j "${zipPath}" train-*.jpg`, { stdio: 'pipe' });
  const zipSize = readFileSync(zipPath).length;
  console.log(`  Created: training-images.zip (${(zipSize / 1024 / 1024).toFixed(1)}MB)\n`);

  // Step 4: Upload zip to fal.ai storage
  console.log('Step 4: Uploading to fal.ai storage...');

  // Step 4a: Initiate upload to get presigned URL
  const initiateResult = execFileSync('curl', [
    '-s', '--max-time', '30',
    '-X', 'POST',
    'https://rest.alpha.fal.ai/storage/upload/initiate',
    '-H', `Authorization: Key ${FAL_KEY}`,
    '-H', 'Content-Type: application/json',
    '-d', JSON.stringify({
      file_name: 'chaos-creatures-training-v1.zip',
      content_type: 'application/zip',
    }),
  ], { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });

  let storageUrl;
  let initiateJson;
  try {
    initiateJson = JSON.parse(initiateResult);
  } catch {
    console.log('  Initiate response:', initiateResult.slice(0, 500));
  }

  if (initiateJson?.upload_url && initiateJson?.file_url) {
    // Step 4b: Upload to the presigned URL
    console.log('  Got presigned URL, uploading...');
    execFileSync('curl', [
      '-s', '--max-time', '600',
      '-X', 'PUT',
      initiateJson.upload_url,
      '-H', 'Content-Type: application/zip',
      '--data-binary', `@${zipPath}`,
    ], { encoding: 'utf-8', maxBuffer: 1024 });
    storageUrl = initiateJson.file_url;
  } else {
    // Try direct multipart upload
    console.log('  Trying multipart upload...');
    const formResult = execFileSync('curl', [
      '-s', '--max-time', '600',
      '-X', 'POST',
      'https://rest.alpha.fal.ai/storage/upload',
      '-H', `Authorization: Key ${FAL_KEY}`,
      '-F', `file=@${zipPath};type=application/zip`,
    ], { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });

    try {
      const formJson = JSON.parse(formResult);
      storageUrl = formJson.url || formJson.file_url || formJson.access_url;
    } catch {
      if (formResult.trim().startsWith('http')) {
        storageUrl = formResult.trim();
      }
    }

    if (!storageUrl) {
      console.log('  Upload response:', formResult.slice(0, 500));
      console.error('\n  FAILED to upload.');
      console.log(`  Zip location: ${zipPath}`);
      process.exit(1);
    }
  }

  console.log(`  Uploaded: ${storageUrl}\n`);

  // Step 5: Submit training job
  console.log('Step 5: Submitting LoRA training job...');
  const trainBody = {
    images_data_url: storageUrl,
    trigger_word: 'CHSCRT',
    create_masks: true,
    steps: 1000,
    rank: 16,
    learning_rate: 0.0004,
    caption_prefix: 'CHSCRT style, ',
    caption_dropout_rate: 0.05,
  };

  console.log('  Config:', JSON.stringify({
    trigger_word: trainBody.trigger_word,
    steps: trainBody.steps,
    rank: trainBody.rank,
    learning_rate: trainBody.learning_rate,
    images: copied,
  }, null, 2));

  const endpoint = 'fal-ai/flux-lora-fast-training';
  const submitResult = curlPost(`https://queue.fal.run/${endpoint}`, trainBody, 120);

  if (submitResult.detail) {
    console.error(`  Submit error: ${JSON.stringify(submitResult.detail)}`);
    process.exit(1);
  }

  const requestId = submitResult.request_id;
  if (!requestId) {
    console.log('  Submit response:', JSON.stringify(submitResult, null, 2));
    console.error('  No request_id returned');
    process.exit(1);
  }

  console.log(`  Training job submitted! Request ID: ${requestId}\n`);

  // Step 6: Poll for completion
  console.log('Step 6: Waiting for training to complete...');
  console.log('  (This typically takes 5-15 minutes)\n');

  const pollUrl = `https://queue.fal.run/${endpoint}/requests/${requestId}/status`;
  let lastStatus = '';
  while (true) {
    try {
      const status = curlGet(pollUrl, 20);
      if (status.status !== lastStatus) {
        const ts = new Date().toLocaleTimeString();
        console.log(`  [${ts}] Status: ${status.status}${status.queue_position != null ? ` (queue position: ${status.queue_position})` : ''}`);
        lastStatus = status.status;
      }
      if (status.status === 'COMPLETED') break;
      if (status.status === 'FAILED') {
        console.error(`  FAILED: ${JSON.stringify(status)}`);
        process.exit(1);
      }
    } catch (err) {
      // Polling errors are OK, just retry
    }
    execFileSync('sleep', ['5']);
  }

  // Step 7: Get results
  console.log('\nStep 7: Fetching results...');
  const resultUrl = `https://queue.fal.run/${endpoint}/requests/${requestId}`;
  const result = curlGet(resultUrl, 60);

  if (result.detail) {
    console.error(`  Error: ${JSON.stringify(result.detail)}`);
    process.exit(1);
  }

  // Save full result
  const resultPath = join(__dirname, 'preview', 'lora-training-result.json');
  writeFileSync(resultPath, JSON.stringify(result, null, 2));

  console.log('\n=== Training Complete! ===\n');

  if (result.diffusers_lora_file?.url) {
    console.log(`  LoRA weights (diffusers): ${result.diffusers_lora_file.url}`);
  }
  if (result.config_file?.url) {
    console.log(`  Config: ${result.config_file.url}`);
  }

  console.log(`\n  Full result saved to: ${resultPath}`);
  console.log(`  Trigger word: CHSCRT`);
  console.log(`  Training images: ${copied}`);

  // Extract the LoRA URL for use in generation
  const loraUrl = result.diffusers_lora_file?.url;
  if (loraUrl) {
    console.log(`\n  To use in generation:`);
    console.log(`    loras: [{ path: "${loraUrl}", scale: 1.0 }]`);
    console.log(`    prompt: "CHSCRT style, [your creature description]"`);
  }
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });

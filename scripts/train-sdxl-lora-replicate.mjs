#!/usr/bin/env node
// train-sdxl-lora-replicate.mjs — Train SDXL LoRA on Replicate using our 35 curated images
// Uses same training set as the FLUX LoRA but targets SDXL architecture
// Result: LoRA weights compatible with fal.ai's fal-ai/lora endpoint (SDXL + multi-LoRA stacking)

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));

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
const REPLICATE_TOKEN = env.REPLICATE_API_TOKEN;
if (!REPLICATE_TOKEN) { console.error('Missing REPLICATE_API_TOKEN in .env'); process.exit(1); }

const TRAIN_ZIP = join(__dirname, 'preview', 'training-set', 'training-images.zip');
if (!existsSync(TRAIN_ZIP)) {
  console.error(`Training zip not found: ${TRAIN_ZIP}`);
  console.error('Run train-style-lora.mjs first to assemble + resize + zip the training set');
  process.exit(1);
}

function replicateApi(method, path, body = null, timeoutSec = 120) {
  const url = `https://api.replicate.com/v1${path}`;
  const args = [
    '-s', '--max-time', String(timeoutSec),
    '-X', method,
    '-H', `Authorization: Bearer ${REPLICATE_TOKEN}`,
  ];

  if (body && typeof body === 'string') {
    // File upload — body is the file path
    args.push('-H', 'Content-Type: multipart/form-data');
    args.push('-F', `content=@${body};type=application/zip;filename=chaos-creatures-training.zip`);
  } else if (body) {
    args.push('-H', 'Content-Type: application/json');
    args.push('-d', JSON.stringify(body));
  }

  args.push(url);

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const result = execFileSync('curl', args, { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });
      return JSON.parse(result);
    } catch (err) {
      if (attempt < 2) {
        console.log(`  Retry ${attempt + 1}...`);
        execFileSync('sleep', [String(3 * (attempt + 1))]);
      } else throw err;
    }
  }
}

async function main() {
  console.log('\n=== SDXL LoRA Training on Replicate ===\n');

  const zipSize = readFileSync(TRAIN_ZIP).length;
  console.log(`Training zip: ${(zipSize / 1024 / 1024).toFixed(1)}MB`);
  console.log(`Estimated cost: ~$0.50-0.75\n`);

  // Step 1: Use training zip already uploaded to R2
  const inputImagesUrl = 'https://pub-ab96c6d0742748d19e4ad5502f3fea09.r2.dev/training/chaos-creatures-training-v1.zip';
  console.log(`Step 1: Using R2-hosted training zip`);
  console.log(`  URL: ${inputImagesUrl}\n`);

  // Step 2: Create the training
  console.log('Step 2: Submitting SDXL LoRA training...');

  // SDXL training version (stability-ai/sdxl)
  const SDXL_VERSION = 'da77bc59ee60423279fd632efb4795ab731d9e3ca9705ef3341091fb989b7eaf';

  const trainBody = {
    destination: 'asa7388/chaos-creatures-sdxl',
    input: {
      input_images: inputImagesUrl,
      is_lora: true,
      token_string: 'CHSCRT',
      caption_prefix: 'a painting in the style of CHSCRT, ',
      max_train_steps: 1000,
      train_batch_size: 4,
      resolution: 1024,
      unet_learning_rate: 1e-6,
      lora_lr: 1e-4,
      lr_scheduler: 'constant',
    },
  };

  console.log('  Config:', JSON.stringify({
    trigger: trainBody.input.token_string,
    steps: trainBody.input.max_train_steps,
    resolution: trainBody.input.resolution,
    lora_lr: trainBody.input.lora_lr,
    unet_lr: trainBody.input.unet_learning_rate,
  }, null, 2));

  const trainResult = replicateApi(
    'POST',
    `/models/stability-ai/sdxl/versions/${SDXL_VERSION}/trainings`,
    trainBody,
    120
  );

  if (trainResult.detail || trainResult.error) {
    console.error('Training submit failed:', JSON.stringify(trainResult, null, 2));
    process.exit(1);
  }

  const trainingId = trainResult.id;
  console.log(`  Training ID: ${trainingId}`);
  console.log(`  Status: ${trainResult.status}\n`);

  // Step 3: Poll for completion
  console.log('Step 3: Waiting for training to complete...');
  console.log('  (Typically 10-20 minutes)\n');

  let lastStatus = '';
  let finalResult;
  while (true) {
    try {
      const status = replicateApi('GET', `/trainings/${trainingId}`, null, 30);
      if (status.status !== lastStatus) {
        const ts = new Date().toLocaleTimeString();
        console.log(`  [${ts}] Status: ${status.status}`);
        lastStatus = status.status;
      }

      if (status.status === 'succeeded') {
        finalResult = status;
        break;
      }
      if (status.status === 'failed' || status.status === 'canceled') {
        console.error(`  FAILED: ${JSON.stringify(status.error || status)}`);
        // Save error details
        writeFileSync(
          join(__dirname, 'preview', 'sdxl-lora-training-error.json'),
          JSON.stringify(status, null, 2)
        );
        process.exit(1);
      }
    } catch (err) {
      // Polling errors are OK, just retry
    }
    execFileSync('sleep', ['10']);
  }

  // Step 4: Save results
  console.log('\n=== Training Complete! ===\n');

  const resultPath = join(__dirname, 'preview', 'sdxl-lora-training-result.json');
  writeFileSync(resultPath, JSON.stringify(finalResult, null, 2));

  // Extract the weights URL
  const output = finalResult.output;
  console.log('  Output:', JSON.stringify(output, null, 2));
  console.log(`\n  Full result saved to: ${resultPath}`);

  if (output?.weights || output?.version) {
    console.log('\n  To use with fal.ai SDXL (fal-ai/lora):');
    console.log(`    loras: [`);
    console.log(`      { path: "${output.weights || 'CHECK_RESULT'}", scale: 0.7 },  // Our style`);
    console.log(`      { path: "EldritchPaletteKnife LoRA URL", scale: 0.5 },        // Oil texture`);
    console.log(`    ]`);
    console.log(`    prompt: "a painting in the style of CHSCRT, [your creature]"`);
  }

  // Also save just the key info
  const summary = {
    trainingId,
    status: 'succeeded',
    output,
    trigger: 'CHSCRT',
    captionPrefix: 'a painting in the style of CHSCRT, ',
    trainingImages: 35,
    steps: 1000,
    cost: finalResult.metrics?.predict_time
      ? `~$${(finalResult.metrics.predict_time * 0.000975).toFixed(2)}`
      : 'check billing',
  };
  writeFileSync(
    join(__dirname, 'preview', 'sdxl-lora-summary.json'),
    JSON.stringify(summary, null, 2)
  );
  console.log(`  Summary saved to: sdxl-lora-summary.json`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });

#!/usr/bin/env node
// upload-v18-to-r2.mjs — Upload v18 test batch PNGs to R2 CDN
// Usage: node scripts/upload-v18-to-r2.mjs

import { createHmac, createHash } from 'crypto';
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load env from game-server/.env
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

const R2_ACCOUNT_ID = env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = env.R2_BUCKET_NAME;
const R2_PUBLIC_URL = env.R2_PUBLIC_URL;

for (const [k, v] of Object.entries({ R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_PUBLIC_URL })) {
  if (!v) { console.error(`Missing env var: ${k}`); process.exit(1); }
}

// R2 upload using AWS4 signature (same pattern as generate-test-cards.mjs)
function sha256(data) { return createHash('sha256').update(data).digest('hex'); }
function hmacSha256(key, data) { return createHmac('sha256', key).update(data).digest(); }

async function uploadToR2(imageBuffer, key) {
  const host = `${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
  const url = `https://${host}/${R2_BUCKET_NAME}/${key}`;
  const now = new Date();
  const dateStr = now.toISOString().replace(/[:-]/g, '').split('.')[0] + 'Z';
  const dateOnly = dateStr.substring(0, 8);
  const region = 'auto';
  const service = 's3';
  const credentialScope = `${dateOnly}/${region}/${service}/aws4_request`;
  const signedHeaders = 'content-type;host;x-amz-content-sha256;x-amz-date';
  const payloadHash = 'UNSIGNED-PAYLOAD';

  const canonicalHeaders = `content-type:image/png\nhost:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${dateStr}\n`;
  const canonicalRequest = `PUT\n/${R2_BUCKET_NAME}/${key}\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;
  const stringToSign = `AWS4-HMAC-SHA256\n${dateStr}\n${credentialScope}\n${sha256(canonicalRequest)}`;

  const kDate = hmacSha256(`AWS4${R2_SECRET_ACCESS_KEY}`, dateOnly);
  const kRegion = hmacSha256(kDate, region);
  const kService = hmacSha256(kRegion, service);
  const signingKey = hmacSha256(kService, 'aws4_request');
  const signature = hmacSha256(signingKey, stringToSign).toString('hex');

  const authorization = `AWS4-HMAC-SHA256 Credential=${R2_ACCESS_KEY_ID}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const resp = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': authorization,
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
      'x-amz-content-sha256': payloadHash,
      'x-amz-date': dateStr,
    },
    body: imageBuffer,
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`R2 upload failed: HTTP ${resp.status}: ${errText}`);
  }

  return `${R2_PUBLIC_URL.replace(/\/$/, '')}/${key}`;
}

// Main
async function main() {
  const manifestPath = resolve(__dirname, 'preview/pool-v18/manifest.json');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
  const results = [];

  console.log(`Uploading ${manifest.length} v18 images to R2...\n`);

  for (const card of manifest) {
    const pngPath = resolve(__dirname, 'preview/pool-v18', card.fileName);
    const imageBuffer = readFileSync(pngPath);
    const r2Key = `cards/v18-test/${card.fileName}`;

    process.stdout.write(`  ${card.name} (${card.faction})...`);
    const publicUrl = await uploadToR2(imageBuffer, r2Key);
    console.log(` OK → ${publicUrl}`);

    results.push({
      ...card,
      r2Url: publicUrl,
    });
  }

  // Write results with R2 URLs
  const outputPath = resolve(__dirname, 'preview/pool-v18/r2-urls.json');
  writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`\nDone! ${results.length}/${manifest.length} uploaded.`);
  console.log(`R2 URLs saved to: ${outputPath}`);

  // Print Swift mock data for dev mode
  console.log('\n--- Swift mock CardInstance data ---\n');
  const factionMap = {
    IRONWRIGHT: 'ironwrightId',
    FEY_COURTS: 'feyId',
    DEMONIC: 'demonicId',
    CELESTIAL_CRUSADE: 'celestialId',
    THE_ENDLESS: 'endlessId',
    NEUTRAL: 'ironwrightId', // Ruins are neutral, assign to any faction for now
  };
  const compStats = {
    ACT: { atk: 5, hp: 3, cm: 4 },
    PORTRAIT: { atk: 3, hp: 4, cm: 3 },
    ENV: { atk: 2, hp: 6, cm: 5 },
    NAR: { atk: 4, hp: 4, cm: 4 },
    OBJ: { atk: null, hp: 8, cm: 3 },
  };

  for (const r of results) {
    const stats = compStats[r.comp] || { atk: 3, hp: 3, cm: 3 };
    const isRuin = r.faction === 'NEUTRAL';
    const cardType = isRuin ? '.planarRuin' : '.creature';
    const atkVal = stats.atk === null ? 'nil' : String(stats.atk);
    console.log(`CardInstance(id: UUID(), templateId: UUID(), ownerId: devPlayerId, cardType: ${cardType}, tier: .common, currentName: "${r.name}", currentAttack: ${atkVal}, currentHealth: ${stats.hp}, currentManaCost: ${stats.cm}, instabilityValue: 1, innateKeywords: [], modifierKeywords: [], evolutionHistory: [], modifiers: [], triggeredAbilities: [], chaosEnergy: 0, gamesPlayed: 0, artUrl: "${r.r2Url}", flavorText: "Test card — v18 batch", artPromptHistory: [], isFavorite: false, inDeckIds: [], createdAt: now, lastEvolvedAt: nil),`);
  }
}

main().catch(err => { console.error(err); process.exit(1); });

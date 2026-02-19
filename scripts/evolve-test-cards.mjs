#!/usr/bin/env node
// evolve-test-cards.mjs — Evolve base cards from Common → Uncommon
// Uses FLUX Kontext img2img to transform existing card art.
// Usage: node scripts/evolve-test-cards.mjs

import { createClient } from '../packages/game-server/node_modules/@supabase/supabase-js/dist/index.mjs';
import { createHmac, createHash } from 'crypto';
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
const R2_ACCOUNT_ID = env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = env.R2_BUCKET_NAME;
const R2_PUBLIC_URL = env.R2_PUBLIC_URL;

// ==========================================================================
// Style anchor (v5 — public domain artist references only)
// ==========================================================================

const STYLE_ANCHOR =
  'fantasy creature illustration in the style of Gustave Dore engravings and N.C. Wyeth oil paintings, ' +
  'traditional media on illustration board, thick acrylic and ink on textured watercolor paper, ' +
  'heavy visible impasto brushstrokes, dry brush ink linework, crosshatching in shadow areas, ' +
  'rough sketchy rendering with areas left intentionally unfinished and raw, ' +
  'dramatic chiaroscuro lighting with a single harsh directional light source, deep blacks, ' +
  'muted earth tones, raw umber and burnt sienna, desaturated and muddy palette, ' +
  'visible paper grain and canvas texture throughout, paint cracking at edges, ' +
  'dark moody atmospheric illustration, raw unpolished asymmetric anatomy, ' +
  '3:4 portrait ratio, no text no borders no UI no watermarks, ' +
  'NOT digital art, NOT 3D render, NOT smooth, NOT airbrushed, NOT photorealistic, NOT CGI, NOT clean lines';

// Faction environments for evolution art (mirrors prompts.ts)
const FACTION_ENVIRONMENTS = {
  ironwright: [
    'inside a vast steam-powered foundry with molten metal rivers and chain-driven machinery',
    'atop a massive clockwork bridge spanning a canyon of interlocking gears',
    'in a brass and copper workshop littered with half-finished automata and blueprints',
    'on the observation deck of a towering industrial spire belching steam into orange skies',
    'inside a walking factory, mechanical legs visible through floor grates, landscape moving outside windows',
  ],
  fey: [
    'in a moonlit glade where bioluminescent mushrooms cast soft blue-green light on ancient stones',
    'beneath the canopy of the World Tree, roots thick as rivers, leaves filtering golden twilight',
    'at the shore of an enchanted lake reflecting a sky full of aurora and floating islands',
    'in a twilight meadow of giant wildflowers where fireflies spell out forgotten runes',
    'deep inside a crystal cave where living gemstones hum with harmonic resonance',
  ],
  demonic: [
    'on a volcanic cliff overlooking a sea of lava, obsidian spires rising from the molten surface',
    'in a throne room built from the bones of fallen titans, hellfire braziers lining the walls',
    'at the edge of a reality rift where the material world crumbles into the void',
    'on an ash-covered battlefield strewn with shattered weapons and smoldering craters',
    'inside a collapsed citadel where gravity fails and stone blocks float in burning air',
  ],
};

const FACTION_ENV_MAP = {
  IRONWRIGHT: 'ironwright',
  FEY_COURTS: 'fey',
  DEMONIC: 'demonic',
};

function selectEnvironment(factionKey) {
  const envKey = FACTION_ENV_MAP[factionKey] || 'ironwright';
  const envs = FACTION_ENVIRONMENTS[envKey];
  return envs[Math.floor(Math.random() * envs.length)];
}

const NEGATIVE_PROMPT =
  'text, words, letters, watermarks, signatures, logos, borders, frames, NSFW, explicit content, ' +
  'gore, distorted anatomy, multiple heads, deformed limbs, extra limbs, fused body parts, ' +
  '3d render, CGI, photorealistic, airbrushed, smooth plastic skin, digital art, vector art, ' +
  'deviantart, artstation trending, oversaturated, neon glow, stock photo, generic, ' +
  'white background, collage, grid layout, concept art sheet';

// ==========================================================================
// Evolution specs: 3 base cards → 3 Uncommon evolutions
// ==========================================================================

const EVOLUTIONS = [
  {
    spec_id: 'iron-v3-01-evo',
    faction_key: 'IRONWRIGHT',
    base_art_url: 'https://pub-ab96c6d0742748d19e4ad5502f3fea09.r2.dev/cards/ironwright/common/iron-v3-01.png',
    base_name: 'Furnace Sentinel',
    direction: 'ORDER',
    modifier_description: 'Large visible hydraulic cylinders extending along the limbs, surfaces polished and reinforced, additional heavy riveting over seams',
    faction_style: 'grimy industrial steampunk, corroded brass and blackened iron, in the style of John Martin and Gustave Dore',
    // ORDER: refinement, structure, crystallization
    transform_instruction:
      'Refine and upgrade this mechanical creature with Order energy. ' +
      'Add reinforced hydraulic pistons along its arms and legs. Polish key armor plates to a cleaner finish while keeping the weathered base. ' +
      'Add a faint amber crystalline glow emanating from its furnace core, more controlled and structured. ' +
      'The creature should look upgraded and fortified but still recognizable as the same golem.',
    strength: 0.40,
  },
  /*{
    spec_id: 'fey-v3-01-evo',
    faction_key: 'FEY_COURTS',
    base_art_url: 'https://pub-ab96c6d0742748d19e4ad5502f3fea09.r2.dev/cards/fey_courts/common/fey-v3-01.png',
    base_name: 'Thornroot Warden',
    direction: 'CHAOS',
    modifier_description: 'Eyes shift to predatory feral glow, sharp defensive thorns erupting from joints, the creature appears larger and more imposing',
    faction_style: 'dark fey forest creature, twisted ancient wood, in the style of Arthur Rackham and Edmund Dulac',
    // CHAOS: wildness, primal fury, untamed
    transform_instruction:
      'Transform this forest root creature with violent Chaos energy. ' +
      'Its knothole eyes now burn with intense predatory green fire. Jagged thorns erupt aggressively from its joints and spine. ' +
      'The bark cracks and splinters revealing wild red-purple chaos energy pulsing beneath. It looks larger, wilder, more feral. ' +
      'Moss becomes tangled and matted. The creature should look like it has gone feral and dangerous.',
    strength: 0.55,
  },*/
  {
    spec_id: 'demon-v3-01-evo',
    faction_key: 'DEMONIC',
    base_art_url: 'https://pub-ab96c6d0742748d19e4ad5502f3fea09.r2.dev/cards/demonic/common/demon-v3-01.png',
    base_name: 'Molten Bone Ripper',
    direction: 'CHAOS',
    modifier_description: 'Glowing molten lava cracks running through flesh like veins of liquid fire, hellfire corona engulfing the creature',
    faction_style: 'grotesque infernal creature, fused bone and volcanic rock, in the style of Gustave Dore and Hieronymus Bosch',
    // CHAOS: unbound carnage, apocalyptic
    transform_instruction:
      'Transform this infernal bone creature with explosive Chaos energy. ' +
      'Deep glowing lava cracks split open across its entire body like volcanic fissures. A corona of hellfire erupts from its back and shoulders. ' +
      'The broken horn stump now glows white-hot. Chains glow red from heat. The molten interior is now visible through widening cracks. ' +
      'The creature should look like it is about to erupt, barely containing its own destructive power.',
    strength: 0.55,
  },
];

// ==========================================================================
// fal.ai FLUX Kontext call
// ==========================================================================

async function callFalKontext(body) {
  const maxRetries = 3;
  let delay = 3000;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch('https://fal.run/fal-ai/flux-kontext/dev', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${FAL_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (response.ok) return await response.json();

    const errText = await response.text();
    if (response.status === 422) {
      // Validation error — don't retry, show the error
      throw new Error(`fal.ai Kontext 422: ${errText}`);
    }
    if (response.status === 429 || response.status >= 500) {
      if (attempt < maxRetries) {
        console.log(`  fal.ai ${response.status}, retrying in ${delay / 1000}s...`);
        await new Promise(r => setTimeout(r, delay));
        delay *= 2;
        continue;
      }
    }
    throw new Error(`fal.ai Kontext HTTP ${response.status}: ${errText}`);
  }
}

// ==========================================================================
// R2 upload (same as generate script)
// ==========================================================================

function sha256(data) {
  return createHash('sha256').update(data).digest('hex');
}
function hmacSha256(key, data) {
  return createHmac('sha256', key).update(data).digest();
}

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

  const uploadResponse = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': authorization,
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
      'x-amz-content-sha256': payloadHash,
      'x-amz-date': dateStr,
      'Host': host,
    },
    body: imageBuffer,
  });

  if (!uploadResponse.ok) {
    const errText = await uploadResponse.text();
    throw new Error(`R2 upload failed: HTTP ${uploadResponse.status}: ${errText}`);
  }

  return `${R2_PUBLIC_URL.replace(/\/$/, '')}/${key}`;
}

// ==========================================================================
// Main
// ==========================================================================

async function evolveCard(evo) {
  console.log(`\n--- Evolving: ${evo.base_name} → ${evo.direction} (${evo.faction_key}) ---`);

  // Build the evolution prompt with faction environment for variety
  const environment = selectEnvironment(evo.faction_key);
  const fullPrompt = [
    STYLE_ANCHOR,
    evo.faction_style,
    evo.transform_instruction,
    'Keep the same creature, same pose angle, same composition. The creature must remain clearly recognizable.',
    `Background setting: ${environment}`,
    'Three-quarter view portrait, strong silhouette, atmospheric background, NOT clean NOT smooth NOT digital',
  ].join('. ');

  const request = {
    image_url: evo.base_art_url,
    prompt: fullPrompt,
    negative_prompt: NEGATIVE_PROMPT,
    image_size: 'portrait_4_3',
    num_inference_steps: 28,
    guidance_scale: 7.0,
    strength: evo.strength,
    num_images: 1,
    enable_safety_checker: true,
    output_format: 'png',
  };

  // Download base image and convert to data URI to avoid fal.ai URL download issues
  console.log('  Downloading base image...');
  const baseImgResponse = await fetch(evo.base_art_url);
  if (!baseImgResponse.ok) throw new Error(`Base image download failed: ${baseImgResponse.status}`);
  const baseBuffer = Buffer.from(await baseImgResponse.arrayBuffer());
  const dataUri = `data:image/png;base64,${baseBuffer.toString('base64')}`;
  request.image_url = dataUri;
  console.log(`  Base image loaded (${(baseBuffer.length / 1024).toFixed(0)}KB), calling FLUX Kontext (strength: ${evo.strength})...`);
  const result = await callFalKontext(request);

  if (result.has_nsfw_concepts?.[0]) {
    throw new Error('NSFW content detected');
  }
  if (!result.images?.[0]?.url) {
    throw new Error('No image URL in response');
  }

  const tempUrl = result.images[0].url;
  console.log(`  Evolution generated (seed: ${result.seed})`);

  // Download
  console.log('  Downloading...');
  const imgResponse = await fetch(tempUrl);
  const imageBuffer = Buffer.from(await imgResponse.arrayBuffer());
  console.log(`  Downloaded: ${(imageBuffer.length / 1024).toFixed(0)}KB`);

  // Upload to R2
  const r2Key = `cards/${evo.faction_key.toLowerCase()}/uncommon/${evo.spec_id}.png`;
  console.log(`  Uploading to R2: ${r2Key}`);
  const artUrl = await uploadToR2(imageBuffer, r2Key);
  console.log(`  URL: ${artUrl}`);

  return artUrl;
}

async function main() {
  console.log('=== Chaos Creatures — Evolution Test (Common → Uncommon) ===');

  const results = [];

  for (const evo of EVOLUTIONS) {
    try {
      const artUrl = await evolveCard(evo);
      results.push({ name: evo.base_name, direction: evo.direction, faction: evo.faction_key, artUrl, success: true });
    } catch (err) {
      console.error(`  FAILED: ${err.message}`);
      results.push({ name: evo.base_name, direction: evo.direction, faction: evo.faction_key, success: false, error: err.message });
    }
  }

  console.log('\n=== RESULTS ===');
  console.log('─'.repeat(60));
  for (const r of results) {
    const status = r.success ? '✓' : '✗';
    const dir = r.direction === 'ORDER' ? 'ORDER' : 'CHAOS';
    console.log(`${status} [${r.faction}] ${r.name} → ${dir}${r.artUrl ? ` — ${r.artUrl}` : ''}`);
    if (r.error) console.log(`  Error: ${r.error}`);
  }
  console.log('─'.repeat(60));
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});

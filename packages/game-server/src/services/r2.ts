// Chaos Creatures -- Cloudflare R2 Storage Utilities
// Source: docs/design/06-technical-architecture.md Section 8
// Source: docs/design/05-content-pipeline.md Section 3c
//
// R2 is S3-compatible. We use the AWS SDK v3 with R2's endpoint.
// All card art is stored as WebP in R2 and served via built-in CDN.
//
// Key format:
//   Base card:  cards/{faction}/{rarity}/{card_id}_{tier}.webp
//   Evolution:  cards/{faction}/{rarity}/{card_id}_{tier}_evo{n}.webp
//   Fallback:   cards/{faction}/{rarity}/{card_id}_{tier}_fallback.webp
//
// Environment variables:
//   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY,
//   R2_BUCKET_NAME, R2_PUBLIC_URL

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';

// =============================================================================
// Configuration
// =============================================================================

export interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicUrl: string;
}

function loadR2Config(): R2Config {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.R2_BUCKET_NAME;
  const publicUrl = process.env.R2_PUBLIC_URL;

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName || !publicUrl) {
    throw new Error(
      'Missing R2 environment variables. Required: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, ' +
        'R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_PUBLIC_URL'
    );
  }

  return { accountId, accessKeyId, secretAccessKey, bucketName, publicUrl };
}

// Lazy singleton -- only created when first used
let _client: S3Client | null = null;
let _config: R2Config | null = null;

function getClient(): S3Client {
  if (!_client) {
    _config = loadR2Config();
    _client = new S3Client({
      region: 'auto',
      endpoint: `https://${_config.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: _config.accessKeyId,
        secretAccessKey: _config.secretAccessKey,
      },
    });
  }
  return _client;
}

function getConfig(): R2Config {
  if (!_config) {
    getClient(); // initializes _config
  }
  return _config!;
}

// =============================================================================
// Key Generation
// =============================================================================

/**
 * Generate the R2 object key for base card art.
 * Format: cards/{faction}/{rarity}/{card_id}_{tier}.webp
 */
export function baseCardKey(
  faction: string,
  rarity: string,
  cardId: string,
  tier: string
): string {
  return `cards/${faction.toLowerCase()}/${rarity.toLowerCase()}/${cardId}_${tier.toLowerCase()}.webp`;
}

/**
 * Generate the R2 object key for evolution art.
 * Format: cards/{faction}/{rarity}/{card_id}_{tier}_evo{n}.webp
 */
export function evolutionArtKey(
  faction: string,
  rarity: string,
  cardId: string,
  tier: string,
  evolutionNumber: number
): string {
  return `cards/${faction.toLowerCase()}/${rarity.toLowerCase()}/${cardId}_${tier.toLowerCase()}_evo${evolutionNumber}.webp`;
}

/**
 * Generate the R2 object key for fallback art.
 * Format: cards/{faction}/{rarity}/{card_id}_{tier}_fallback.webp
 */
export function fallbackArtKey(
  faction: string,
  rarity: string,
  cardId: string,
  tier: string
): string {
  return `cards/${faction.toLowerCase()}/${rarity.toLowerCase()}/${cardId}_${tier.toLowerCase()}_fallback.webp`;
}

// =============================================================================
// Upload / Delete / URL
// =============================================================================

/**
 * Upload an image buffer to Cloudflare R2.
 *
 * @param buffer - The image data as a Buffer or Uint8Array
 * @param key - The R2 object key (use baseCardKey/evolutionArtKey helpers)
 * @param contentType - MIME type (default: 'image/webp')
 * @returns The public CDN URL for the uploaded image
 */
export async function uploadToR2(
  buffer: Buffer | Uint8Array,
  key: string,
  contentType: string = 'image/webp'
): Promise<string> {
  const client = getClient();
  const config = getConfig();

  await client.send(
    new PutObjectCommand({
      Bucket: config.bucketName,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000, immutable',
    })
  );

  return getPublicUrl(key);
}

/**
 * Return the public CDN URL for a stored image.
 */
export function getPublicUrl(key: string): string {
  const config = getConfig();
  // Remove trailing slash from publicUrl if present
  const baseUrl = config.publicUrl.replace(/\/$/, '');
  return `${baseUrl}/${key}`;
}

/**
 * Delete an image from R2 (used for rejected art cleanup).
 */
export async function deleteFromR2(key: string): Promise<void> {
  const client = getClient();
  const config = getConfig();

  await client.send(
    new DeleteObjectCommand({
      Bucket: config.bucketName,
      Key: key,
    })
  );
}

/**
 * Check if an object exists in R2.
 * Returns true if the object exists, false otherwise.
 */
export async function existsInR2(key: string): Promise<boolean> {
  const client = getClient();
  const config = getConfig();

  try {
    await client.send(
      new HeadObjectCommand({
        Bucket: config.bucketName,
        Key: key,
      })
    );
    return true;
  } catch {
    return false;
  }
}

// =============================================================================
// Testing Helpers
// =============================================================================

/**
 * Reset the singleton client. Only used in tests.
 */
export function _resetClient(): void {
  _client = null;
  _config = null;
}

/**
 * Inject a custom client for testing. Only used in tests.
 */
export function _setClient(client: S3Client, config: R2Config): void {
  _client = client;
  _config = config;
}

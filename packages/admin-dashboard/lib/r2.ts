// Chaos Creatures Admin Dashboard — R2 Upload Utility
// Uploads card art and assets to Cloudflare R2 via S3-compatible API.
// Returns public CDN URLs for stored objects.
// Lazy client initialization to avoid build-time errors when env vars are not set.

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID!;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'chaos-creatures-art';
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || 'https://pub-ab96c6d0742748d19e4ad5502f3fea09.r2.dev';

let client: S3Client | null = null;

function getClient(): S3Client {
  if (!client) {
    client = new S3Client({
      region: 'auto',
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
    });
  }
  return client;
}

export async function uploadToR2(
  buffer: Buffer | Uint8Array,
  key: string,
  contentType: string = 'image/png'
): Promise<string> {
  await getClient().send(
    new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000, immutable',
    })
  );
  return getPublicUrl(key);
}

export function getPublicUrl(key: string): string {
  return `${R2_PUBLIC_URL}/${key}`;
}

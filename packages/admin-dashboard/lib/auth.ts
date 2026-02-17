// Chaos Creatures Admin Dashboard — Auth Helpers
// Validates admin session cookie for middleware and server components.
// Token format: base64(timestamp:hmac) where hmac = HMAC-SHA256(timestamp, secret).
// The secret is never stored in the cookie.

import { createHmac, timingSafeEqual } from 'crypto';

function getSessionToken(): string {
  const token = process.env.ADMIN_JWT_SECRET;
  if (!token) {
    throw new Error('ADMIN_JWT_SECRET environment variable is required');
  }
  return token;
}
const SESSION_MAX_AGE_MS = 8 * 60 * 60 * 1000; // 8 hours in milliseconds

export function validateSession(cookieValue: string | undefined): boolean {
  if (!cookieValue) return false;

  try {
    const decoded = Buffer.from(cookieValue, 'base64').toString('utf-8');
    const [timestampStr, hmac] = decoded.split(':');
    const timestamp = parseInt(timestampStr, 10);

    if (isNaN(timestamp)) return false;
    if (!hmac) return false;

    // Check if session has expired (8 hours)
    if (Date.now() - timestamp > SESSION_MAX_AGE_MS) return false;

    // Verify HMAC — recompute from timestamp and compare using timing-safe equality
    const expectedHmac = createHmac('sha256', getSessionToken()).update(timestampStr).digest('hex');
    if (expectedHmac.length !== hmac.length) return false;
    if (!timingSafeEqual(Buffer.from(expectedHmac), Buffer.from(hmac))) return false;

    return true;
  } catch {
    return false;
  }
}

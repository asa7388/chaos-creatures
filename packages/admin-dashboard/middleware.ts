// Chaos Creatures Admin Dashboard — Next.js Middleware
// Auth guard: redirects unauthenticated requests to /login.
// Excludes: /login, /api/health, /api/auth, static assets.
// REQ-179: Single admin password, 8hr session.
// Token format: base64(timestamp:hmac) where hmac = HMAC-SHA256(timestamp, secret).
// Uses Web Crypto API (Edge Runtime compatible) — no Node.js crypto import.

import { NextRequest, NextResponse } from 'next/server';

function getSessionToken(): string {
  const token = process.env.ADMIN_JWT_SECRET;
  if (!token) {
    throw new Error('ADMIN_JWT_SECRET environment variable is required');
  }
  return token;
}
const SESSION_MAX_AGE_MS = 8 * 60 * 60 * 1000; // 8 hours

// Convert hex string to Uint8Array for comparison
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

// Constant-time comparison of two Uint8Arrays
function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a[i] ^ b[i];
  }
  return result === 0;
}

async function validateSession(cookieValue: string | undefined): Promise<boolean> {
  if (!cookieValue) return false;
  try {
    const decoded = Buffer.from(cookieValue, 'base64').toString('utf-8');
    const [timestampStr, hmac] = decoded.split(':');
    const timestamp = parseInt(timestampStr, 10);
    if (isNaN(timestamp)) return false;
    if (!hmac) return false;

    // Check if session has expired (8 hours)
    if (Date.now() - timestamp > SESSION_MAX_AGE_MS) return false;

    // Verify HMAC using Web Crypto API (Edge Runtime compatible)
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(getSessionToken()),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(timestampStr));

    // Convert signature to hex string for comparison
    const expectedHex = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    if (expectedHex.length !== hmac.length) return false;
    if (!timingSafeEqual(hexToBytes(expectedHex), hexToBytes(hmac))) return false;

    return true;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes — no auth required
  if (
    pathname === '/login' ||
    pathname === '/api/health' ||
    pathname === '/api/auth' ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get('admin_session')?.value;
  const isValid = await validateSession(sessionCookie);

  if (!isValid) {
    // Redirect to login for page requests
    if (!pathname.startsWith('/api/')) {
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
    // Return 401 for API requests
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all routes except static files
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};

// Chaos Creatures Admin Dashboard — Next.js Middleware
// Auth guard: redirects unauthenticated requests to /login.
// Excludes: /login, /api/health, /api/auth, static assets.
// REQ-179: Single admin password, 8hr session.

import { NextRequest, NextResponse } from 'next/server';

const SESSION_TOKEN = process.env.ADMIN_JWT_SECRET || 'chaos-admin-session';
const SESSION_MAX_AGE_MS = 8 * 60 * 60 * 1000; // 8 hours

function validateSession(cookieValue: string | undefined): boolean {
  if (!cookieValue) return false;
  try {
    const decoded = Buffer.from(cookieValue, 'base64').toString('utf-8');
    const [timestampStr, secret] = decoded.split(':');
    const timestamp = parseInt(timestampStr, 10);
    if (isNaN(timestamp)) return false;
    if (secret !== SESSION_TOKEN) return false;
    if (Date.now() - timestamp > SESSION_MAX_AGE_MS) return false;
    return true;
  } catch {
    return false;
  }
}

export function middleware(request: NextRequest) {
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
  const isValid = validateSession(sessionCookie);

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

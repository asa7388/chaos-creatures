// Chaos Creatures Admin Dashboard — Auth API
// POST: Validate admin password, set httpOnly session cookie (8hr expiry).
// DELETE: Clear session cookie (logout).
// REQ-179: Single admin password, 8hr session, no Supabase Auth.

import { NextRequest, NextResponse } from 'next/server';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
function getSessionToken(): string {
  const token = process.env.ADMIN_JWT_SECRET;
  if (!token) {
    throw new Error('ADMIN_JWT_SECRET environment variable is required');
  }
  return token;
}
const SESSION_MAX_AGE = 8 * 60 * 60; // 8 hours in seconds

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      );
    }

    if (!ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: 'Admin password not configured on server' },
        { status: 500 }
      );
    }

    if (password !== ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      );
    }

    // Create a simple session token: base64(timestamp:secret)
    const timestamp = Date.now();
    const token = Buffer.from(`${timestamp}:${getSessionToken()}`).toString('base64');

    const response = NextResponse.json({ success: true });
    response.cookies.set('admin_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_MAX_AGE,
      path: '/',
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set('admin_session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
  return response;
}

// Chaos Creatures Admin Dashboard — Auth API
// TODO: Implement JWT-based admin auth in Wave 2
// POST: Validate admin password, return JWT token.

import { NextResponse } from 'next/server';

export async function POST() {
  // TODO: Implement password validation + JWT signing
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
}

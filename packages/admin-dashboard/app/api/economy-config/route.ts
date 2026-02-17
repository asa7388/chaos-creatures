// Chaos Creatures Admin Dashboard — Economy Config API
// TODO: Implement economy config CRUD in Wave 2
// GET: Fetch all economy_config values.
// PUT: Update a specific config key.

import { NextResponse } from 'next/server';

export async function GET() {
  // TODO: Fetch from Supabase economy_config table
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
}

export async function PUT() {
  // TODO: Update economy_config row
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
}

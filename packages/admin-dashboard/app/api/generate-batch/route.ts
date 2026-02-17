// Chaos Creatures Admin Dashboard — Batch Card Generation API
// TODO: Implement batch generation trigger in Wave 2
// POST: Create generation_jobs entries for a batch of cards.

import { NextResponse } from 'next/server';

export async function POST() {
  // TODO: Insert batch of generation_jobs into Supabase
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
}

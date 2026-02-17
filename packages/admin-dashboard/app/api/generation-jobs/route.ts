// Chaos Creatures Admin Dashboard — Generation Jobs API
// TODO: Implement generation job management in Wave 2
// GET: List generation jobs (pending, completed, failed).
// POST: Approve/reject a completed generation job.

import { NextResponse } from 'next/server';

export async function GET() {
  // TODO: Fetch generation_jobs from Supabase with status filters
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
}

export async function POST() {
  // TODO: Approve/reject generation job
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
}

// Chaos Creatures Admin Dashboard — Factions API
// GET: Fetch all factions for dropdowns and filters.

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const { data, error } = await supabase
    .from('factions')
    .select('id, name, short_name, exclusive_mechanic')
    .order('name');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ factions: data });
}

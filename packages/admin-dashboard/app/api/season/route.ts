// Chaos Creatures Admin Dashboard — Season Management API
// GET: Fetch all seasons (current highlighted).
// POST: Create or update a season (REQ-186).

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const { data, error } = await supabase
    .from('seasons')
    .select('*')
    .order('season_number', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ seasons: data });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'create') {
      const { name, starts_at, ends_at, battle_pass_tiers, season_number } = body;

      if (!name || !starts_at || !ends_at || !season_number) {
        return NextResponse.json(
          { error: 'name, season_number, starts_at, and ends_at are required' },
          { status: 400 }
        );
      }

      const { data, error } = await supabase
        .from('seasons')
        .insert({
          name,
          season_number,
          starts_at,
          ends_at,
          battle_pass_tiers: battle_pass_tiers || 50,
          is_active: false,
        })
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      await supabase.from('admin_audit_log').insert({
        admin_user: 'admin',
        action: 'season_created',
        target_type: 'season',
        target_id: data.id,
        details: { name, season_number },
      });

      return NextResponse.json({ season: data });
    }

    if (action === 'activate') {
      const { season_id } = body;
      if (!season_id) {
        return NextResponse.json(
          { error: 'season_id is required' },
          { status: 400 }
        );
      }

      // Deactivate all other seasons
      await supabase
        .from('seasons')
        .update({ is_active: false })
        .neq('id', season_id);

      // Activate this season
      const { data, error } = await supabase
        .from('seasons')
        .update({ is_active: true })
        .eq('id', season_id)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      await supabase.from('admin_audit_log').insert({
        admin_user: 'admin',
        action: 'season_activated',
        target_type: 'season',
        target_id: season_id,
        details: { name: data.name },
      });

      return NextResponse.json({ season: data });
    }

    if (action === 'deactivate') {
      const { season_id } = body;
      if (!season_id) {
        return NextResponse.json(
          { error: 'season_id is required' },
          { status: 400 }
        );
      }

      const { data, error } = await supabase
        .from('seasons')
        .update({ is_active: false })
        .eq('id', season_id)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      await supabase.from('admin_audit_log').insert({
        admin_user: 'admin',
        action: 'season_deactivated',
        target_type: 'season',
        target_id: season_id,
        details: { name: data.name },
      });

      return NextResponse.json({ season: data });
    }

    return NextResponse.json(
      { error: 'Unknown action. Use: create, activate, deactivate' },
      { status: 400 }
    );
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}

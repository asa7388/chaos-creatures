// Chaos Creatures Admin Dashboard — Economy Config API
// GET: Fetch all economy_config values.
// PUT: Update a specific config key. Logs change to admin_audit_log.
// REQ-180: Read/write interface for economy_config. Changes take effect immediately.

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const { data, error } = await supabase
    .from('economy_config')
    .select('*')
    .order('key');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ config: data });
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { key, value } = body;

    if (!key) {
      return NextResponse.json(
        { error: 'Key is required' },
        { status: 400 }
      );
    }

    // Fetch old value for audit log
    const { data: oldRow } = await supabase
      .from('economy_config')
      .select('value')
      .eq('key', key)
      .single();

    const oldValue = oldRow?.value;

    // Update the config value
    const { data, error } = await supabase
      .from('economy_config')
      .update({
        value: value,
        updated_at: new Date().toISOString(),
        updated_by: 'admin',
      })
      .eq('key', key)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Write audit log entry
    await supabase.from('admin_audit_log').insert({
      admin_user: 'admin',
      action: 'economy_config_update',
      target_type: 'economy_config',
      target_id: key,
      details: {
        old_value: oldValue,
        new_value: value,
      },
    });

    return NextResponse.json({ config: data });
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}

// Chaos Creatures Admin Dashboard — Economy Config Audit Log API
// GET: Fetch recent economy_config change entries from admin_audit_log.

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const { data, error } = await supabase
    .from('admin_audit_log')
    .select('*')
    .eq('action', 'economy_config_update')
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ entries: data });
}

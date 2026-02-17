// Chaos Creatures Admin Dashboard — Validate Balance API
// POST: Proxies to game server validate-balance endpoint (REQ-165).
// Returns validation results for all card templates.

import { NextResponse } from 'next/server';
import { validateBalance } from '@/lib/game-server';
import { supabase } from '@/lib/supabase';

export async function POST() {
  const result = await validateBalance();

  if (result.error) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status }
    );
  }

  // Log the validation run
  await supabase.from('admin_audit_log').insert({
    admin_user: 'admin',
    action: 'balance_validation_run',
    target_type: 'card_templates',
    target_id: null,
    details: { result: result.data },
  });

  return NextResponse.json(result.data);
}

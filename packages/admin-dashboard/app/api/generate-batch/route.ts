// Chaos Creatures Admin Dashboard — Batch Card Generation API
// POST: Proxies to game server batch/start endpoint (REQ-181).
// Also creates generation_jobs entries in Supabase.

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { startBatch } from '@/lib/game-server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { faction_id, count, card_type, creature_type_hint } = body;

    if (!faction_id || !count || !card_type) {
      return NextResponse.json(
        { error: 'faction_id, count, and card_type are required' },
        { status: 400 }
      );
    }

    if (count < 1 || count > 20) {
      return NextResponse.json(
        { error: 'Count must be between 1 and 20' },
        { status: 400 }
      );
    }

    // Create generation jobs in Supabase
    const batch_id = `batch_${Date.now()}`;
    const jobs = [];
    for (let i = 0; i < count; i++) {
      jobs.push({
        job_type: 'BASE_CARD_IMAGE' as const,
        status: 'PENDING' as const,
        priority: -1,
        input_data: {
          faction_id,
          card_type,
          creature_type_hint: creature_type_hint || null,
          batch_id,
          batch_index: i,
        },
      });
    }

    const { data: jobData, error: jobError } = await supabase
      .from('generation_jobs')
      .insert(jobs)
      .select();

    if (jobError) {
      return NextResponse.json(
        { error: `Failed to create jobs: ${jobError.message}` },
        { status: 500 }
      );
    }

    // Try to trigger game server batch processing
    const serverResult = await startBatch({
      faction_id,
      count,
      card_type,
      creature_type_hint,
    });

    // Log admin action
    await supabase.from('admin_audit_log').insert({
      admin_user: 'admin',
      action: 'batch_generation_started',
      target_type: 'generation_batch',
      target_id: batch_id,
      details: {
        faction_id,
        count,
        card_type,
        creature_type_hint,
        jobs_created: jobData?.length || 0,
        server_status: serverResult.status,
      },
    });

    return NextResponse.json({
      batch_id,
      jobs_created: jobData?.length || 0,
      server_notified: serverResult.status === 200,
    });
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}

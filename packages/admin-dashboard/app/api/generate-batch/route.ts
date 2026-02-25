// Chaos Creatures Admin Dashboard — Batch Card Generation API
// POST: Proxies to game server batch/start endpoint (REQ-181).
// Also creates generation_jobs entries in Supabase.

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { startBatch } from '@/lib/game-server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { faction_id, count, card_type, creature_type_hint, creature_descriptions } = body;

    if (!faction_id || !card_type) {
      return NextResponse.json(
        { error: 'faction_id and card_type are required' },
        { status: 400 }
      );
    }

    // If creature_descriptions is provided and non-empty, use its length as the count
    const hasDescriptions = Array.isArray(creature_descriptions) && creature_descriptions.length > 0;
    const effectiveCount = hasDescriptions ? creature_descriptions.length : (count || 5);

    if (effectiveCount < 1 || effectiveCount > 50) {
      return NextResponse.json(
        { error: 'Effective count must be between 1 and 50' },
        { status: 400 }
      );
    }

    // Create generation jobs in Supabase
    const batch_id = `batch_${Date.now()}`;
    const jobs = [];
    for (let i = 0; i < effectiveCount; i++) {
      const description = hasDescriptions ? creature_descriptions[i] : (creature_type_hint || null);
      jobs.push({
        job_type: 'BASE_CARD_IMAGE' as const,
        status: 'PENDING' as const,
        priority: -1,
        input_data: {
          faction_id,
          card_type,
          creature_type_hint: description,
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

    // Try to trigger game server batch processing.
    // This is optional — jobs are already created in Supabase above.
    // If the game server is unreachable, the batch still exists and can be
    // picked up later (e.g. when the server comes back or via manual retry).
    let serverNotified = false;
    let serverError: string | null = null;
    try {
      const serverResult = await startBatch({
        faction_id,
        count: effectiveCount,
        card_type,
        creature_type_hint,
      });
      serverNotified = serverResult.status === 200;
      if (!serverNotified) {
        serverError = serverResult.error || `Server responded with status ${serverResult.status}`;
      }
    } catch (err) {
      serverError = err instanceof Error ? err.message : 'Game server unreachable';
    }

    // Log admin action
    await supabase.from('admin_audit_log').insert({
      admin_user: 'admin',
      action: 'batch_generation_started',
      target_type: 'generation_batch',
      target_id: batch_id,
      details: {
        faction_id,
        count: effectiveCount,
        card_type,
        creature_type_hint,
        creature_descriptions: hasDescriptions ? creature_descriptions : undefined,
        jobs_created: jobData?.length || 0,
        server_notified: serverNotified,
        server_error: serverError,
      },
    });

    return NextResponse.json({
      batch_id,
      jobs_created: jobData?.length || 0,
      server_notified: serverNotified,
      ...(serverError && { server_error: serverError }),
    });
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}

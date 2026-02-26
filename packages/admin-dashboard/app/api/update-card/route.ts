// Chaos Creatures Admin Dashboard — Update Card API
// PATCH a generation_job's input_data to change faction, creature_subtype, etc.
// Accepts job_id, faction_id, and creature_subtype. Tier is derived from subtype.

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { job_id, faction_id, creature_subtype } = body as {
      job_id?: string;
      faction_id?: string;
      creature_subtype?: string;
    };

    if (!job_id) {
      return NextResponse.json(
        { error: 'job_id is required' },
        { status: 400 }
      );
    }

    // Fetch the current job
    const { data: job, error: fetchError } = await supabase
      .from('generation_jobs')
      .select('*')
      .eq('id', job_id)
      .single();

    if (fetchError || !job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Validate faction_id if provided
    if (faction_id) {
      const { data: faction, error: factionError } = await supabase
        .from('factions')
        .select('id, name')
        .eq('id', faction_id)
        .single();

      if (factionError || !faction) {
        return NextResponse.json(
          { error: 'Invalid faction_id' },
          { status: 400 }
        );
      }
    }

    // Build updated input_data by merging with existing
    const currentInputData = (job.input_data || {}) as Record<string, unknown>;
    const updatedInputData: Record<string, unknown> = { ...currentInputData };

    if (faction_id !== undefined) {
      updatedInputData.faction_id = faction_id;
    }

    if (creature_subtype !== undefined) {
      if (creature_subtype === '' || creature_subtype === null) {
        // Remove subtype
        delete updatedInputData.creature_subtype;
      } else {
        updatedInputData.creature_subtype = creature_subtype;
      }
    }

    // Update the generation_job row
    const { error: updateError } = await supabase
      .from('generation_jobs')
      .update({ input_data: updatedInputData })
      .eq('id', job_id);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    // Audit log (best-effort)
    await supabase.from('admin_audit_log').insert({
      admin_user: 'admin',
      action: 'card_metadata_updated',
      target_type: 'generation_job',
      target_id: job_id,
      details: {
        card_name: (job.output_data as Record<string, unknown>)?.name,
        changes: {
          ...(faction_id !== undefined && { faction_id }),
          ...(creature_subtype !== undefined && { creature_subtype }),
        },
      },
    }).then(() => {}, () => {});

    return NextResponse.json({
      success: true,
      input_data: updatedInputData,
    });
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}

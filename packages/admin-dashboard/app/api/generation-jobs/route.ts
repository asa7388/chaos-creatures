// Chaos Creatures Admin Dashboard — Generation Jobs API
// GET: List generation jobs with status/type filters.
// POST: Approve or reject a completed generation job (REQ-182).

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const jobType = searchParams.get('job_type');
  const limit = parseInt(searchParams.get('limit') || '50', 10);

  let query = supabase
    .from('generation_jobs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (status) {
    query = query.eq('status', status);
  }
  if (jobType) {
    query = query.eq('job_type', jobType);
  }

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ jobs: data, count });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { job_id, action, rejection_reason } = body;

    if (!job_id || !action) {
      return NextResponse.json(
        { error: 'job_id and action (approve|reject) are required' },
        { status: 400 }
      );
    }

    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json(
        { error: 'Action must be "approve" or "reject"' },
        { status: 400 }
      );
    }

    // Fetch the job
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

    if (action === 'approve') {
      // Create a card template from the job's output data
      const outputData = job.output_data || {};
      const inputData = job.input_data || {};

      await supabase.from('card_templates').insert({
        name: outputData.name || 'Unnamed Card',
        card_type: outputData.card_type || inputData.card_type || 'CREATURE',
        faction_id: inputData.faction_id,
        base_attack: outputData.base_attack ?? 1,
        base_health: outputData.base_health ?? 1,
        base_instability: outputData.base_instability ?? 0,
        mana_cost: outputData.mana_cost ?? 1,
        base_keywords: outputData.base_keywords || [],
        art_prompt: outputData.art_prompt || '',
        art_url: job.art_url || '',
        flavor_text: outputData.flavor_text || '',
        batch_id: job.id,
        approved_at: new Date().toISOString(),
        approved_by: 'admin',
      });

      // Update job to mark as approved
      await supabase
        .from('generation_jobs')
        .update({
          output_data: { ...outputData, approved: true },
        })
        .eq('id', job_id);

      // Audit log
      await supabase.from('admin_audit_log').insert({
        admin_user: 'admin',
        action: 'card_approved',
        target_type: 'generation_job',
        target_id: job_id,
        details: { card_name: outputData.name },
      });

      return NextResponse.json({ status: 'approved' });
    } else {
      // Reject
      const outputData = job.output_data || {};

      await supabase
        .from('generation_jobs')
        .update({
          output_data: {
            ...outputData,
            approved: false,
            rejection_reason: rejection_reason || 'Rejected by admin',
          },
        })
        .eq('id', job_id);

      // Audit log
      await supabase.from('admin_audit_log').insert({
        admin_user: 'admin',
        action: 'card_rejected',
        target_type: 'generation_job',
        target_id: job_id,
        details: {
          card_name: outputData.name,
          reason: rejection_reason,
        },
      });

      return NextResponse.json({ status: 'rejected' });
    }
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}
